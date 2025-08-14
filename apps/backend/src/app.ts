import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { arrangementsRouter } from './routes/arrangements';
import { visionRouter } from './routes/vision';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/health', healthRouter);
  app.use('/v1', authMiddleware);
  app.use('/v1/arrangements', arrangementsRouter);
  app.use('/v1/vision', visionRouter);

  return app;
}
