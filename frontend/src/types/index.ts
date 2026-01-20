export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

export interface Email {
  id: number;
  user_id: number;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'sent' | 'failed';
  scheduled_for: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}