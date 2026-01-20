import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { emailQueue } from '../queues/emailQueue';
import { rateLimitService } from '../services/rateLimitService';

const router = express.Router();

router.use(authenticate);

router.post('/schedule', async (req: AuthRequest, res) => {
  try {
    const { subject, body, recipients, startTime, delayMs, hourlyLimit } = req.body;
    const userId = req.user!.id;
    const senderEmail = req.user!.email;

    if (!subject || !body || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const emails = [];
    const scheduledStart = new Date(startTime);
    const delay = parseInt(delayMs) || rateLimitService.getMinDelayMs();

    for (let i = 0; i < recipients.length; i++) {
      const scheduledFor = new Date(scheduledStart.getTime() + i * delay);
      
      // Create email record
      const email = await emailService.createEmail({
        userId,
        senderEmail,
        recipientEmail: recipients[i],
        subject,
        body,
        scheduledFor,
      });

      // Schedule job with BullMQ
      const jobDelay = scheduledFor.getTime() - Date.now();
      const job = await emailQueue.add(
        'send-email',
        { emailId: email.id },
        {
          delay: Math.max(0, jobDelay),
          jobId: `email-${email.id}`,
        }
      );

      // Update email with job ID
      await emailService.updateEmailStatus(email.id, 'scheduled');
      
      emails.push(email);
    }

    res.json({
      success: true,
      scheduled: emails.length,
      emails: emails.map(e => ({
        id: e.id,
        to: e.recipient_email,
        scheduledFor: e.scheduled_for,
      })),
    });
  } catch (error: any) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/scheduled', async (req: AuthRequest, res) => {
  try {
    const emails = await emailService.getScheduledEmails(req.user!.id);
    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sent', async (req: AuthRequest, res) => {
  try {
    const emails = await emailService.getSentEmails(req.user!.id);
    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;