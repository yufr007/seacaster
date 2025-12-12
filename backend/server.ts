
import express, { Request, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook';
import gameRoutes from './routes/game';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
// Cast middleware to any to avoid strict PathParams type mismatch errors in some environment setups
app.use(helmet() as any);
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://seacaster.app' }) as any);
app.use(express.json() as any);

// Health Check (for Cloud Run/Railway)
app.get('/health', (req: Request, res: any) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' });
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/game', gameRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: any, next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[SeaCaster] Backend running on port ${PORT}`);
});
