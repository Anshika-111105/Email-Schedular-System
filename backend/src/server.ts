import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { verifySmtpConnection } from './config/smtp';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  try {
    await initDatabase();
    await verifySmtpConnection();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Worker concurrency: ${process.env.WORKER_CONCURRENCY || 5}`);
      console.log(`Min delay between emails: ${process.env.MIN_DELAY_MS || 2000}ms`);
      console.log(`Max emails per hour: ${process.env.MAX_EMAILS_PER_HOUR || 100}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();