import redis from '../config/redis';

export class RateLimitService {
  private readonly maxEmailsPerHour: number;
  private readonly minDelayMs: number;

  constructor() {
    this.maxEmailsPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR || '100');
    this.minDelayMs = parseInt(process.env.MIN_DELAY_MS || '2000');
  }

  private getCurrentHour(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  }

  async checkAndIncrementHourly(senderEmail: string): Promise<boolean> {
    const hourKey = `rate:${senderEmail}:${this.getCurrentHour()}`;
    const count = await redis.incr(hourKey);

    if (count === 1) {
      await redis.expire(hourKey, 3600); // 1 hour
    }

    return count <= this.maxEmailsPerHour;
  }

  async getCurrentCount(senderEmail: string): Promise<number> {
    const hourKey = `rate:${senderEmail}:${this.getCurrentHour()}`;
    const count = await redis.get(hourKey);
    return count ? parseInt(count) : 0;
  }

  async getNextAvailableSlot(senderEmail: string): Promise<Date> {
    const canSend = await this.checkAndIncrementHourly(senderEmail);
    
    if (canSend) {
      return new Date();
    }

    // Decrement since we're not actually sending
    const hourKey = `rate:${senderEmail}:${this.getCurrentHour()}`;
    await redis.decr(hourKey);

    // Schedule for next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour;
  }

  getMinDelayMs(): number {
    return this.minDelayMs;
  }
}

export const rateLimitService = new RateLimitService();