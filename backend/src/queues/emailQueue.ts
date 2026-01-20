import { Queue } from 'bullmq';
import redis from '../config/redis';

export interface EmailJobData {
  emailId: number;
}

export const emailQueue = new Queue<EmailJobData>('email-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 86400, // 24 hours
    },
    removeOnFail: {
      count: 1000,
    },
  },
});

console.log('Email queue initialized');