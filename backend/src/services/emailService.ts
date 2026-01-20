import { query } from '../config/database';
import { transporter } from '../config/smtp';
import { rateLimitService } from './rateLimitService';
import nodemailer from 'nodemailer';

export interface Email {
  id: number;
  user_id: number;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  scheduled_for: Date;
  sent_at?: Date;
  error_message?: string;
  job_id?: string;
}

export class EmailService {
  async createEmail(data: {
    userId: number;
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    scheduledFor: Date;
    jobId?: string;
  }): Promise<Email> {
    const result = await query(
      `INSERT INTO emails (user_id, sender_email, recipient_email, subject, body, scheduled_for, job_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.userId,
        data.senderEmail,
        data.recipientEmail,
        data.subject,
        data.body,
        data.scheduledFor,
        data.jobId,
      ]
    );
    return result.rows[0];
  }

  async getEmailById(id: number): Promise<Email | null> {
    const result = await query('SELECT * FROM emails WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateEmailStatus(
    id: number,
    status: string,
    sentAt?: Date,
    errorMessage?: string
  ): Promise<void> {
    await query(
      `UPDATE emails 
       SET status = $1, sent_at = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, sentAt, errorMessage, id]
    );
  }

  async sendEmail(emailId: number): Promise<void> {
    const email = await this.getEmailById(emailId);
    
    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    if (email.status === 'sent') {
      console.log(`Email ${emailId} already sent, skipping (idempotency)`);
      return;
    }

    // Check rate limit
    const canSend = await rateLimitService.checkAndIncrementHourly(email.sender_email);
    
    if (!canSend) {
      throw new Error('Rate limit exceeded for this hour');
    }

    try {
      const info = await transporter.sendMail({
        from: email.sender_email,
        to: email.recipient_email,
        subject: email.subject,
        text: email.body,
        html: `<p>${email.body.replace(/\n/g, '<br>')}</p>`,
      });

      await this.updateEmailStatus(emailId, 'sent', new Date());
      console.log(`Email ${emailId} sent successfully. Preview: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error: any) {
      await this.updateEmailStatus(emailId, 'failed', undefined, error.message);
      throw error;
    }
  }

  async getScheduledEmails(userId: number): Promise<Email[]> {
    const result = await query(
      `SELECT * FROM emails 
       WHERE user_id = $1 AND status = 'scheduled'
       ORDER BY scheduled_for ASC`,
      [userId]
    );
    return result.rows;
  }

  async getSentEmails(userId: number): Promise<Email[]> {
    const result = await query(
      `SELECT * FROM emails 
       WHERE user_id = $1 AND status IN ('sent', 'failed')
       ORDER BY sent_at DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  }
}

export const emailService = new EmailService();