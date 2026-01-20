import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import { emailService } from '../services/emailService';
import { EmailJobData } from '../queues/emailQueue';
import dotenv from 'dotenv';

dotenv.config();

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');
const minDelayMs = parseInt(process.env.MIN_DELAY_MS || '2000');

export const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { emailId } = job.data;
    
    console.log(`Processing email ${emailId} from job ${job.id}`);
    
    try {
      await emailService.sendEmail(emailId);
      console.log(`Successfully sent email ${emailId}`);
    } catch (error: any) {
      console.error(`Failed to send email ${emailId}:`, error.message);
      throw error; // Will trigger retry
    }
  },
  {
    connection: redis,
    concurrency,
    limiter: {
      max: 1,
      duration: minDelayMs,
    },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log(`Email worker started with concurrency: ${concurrency}`);

// Keep the worker running
process.on('SIGTERM', async () => {
  await emailWorker.close();
  process.exit(0);
});