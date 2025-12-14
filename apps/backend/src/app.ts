import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { arrangementsRouter } from './routes/arrangements';
import { visionRouter } from './routes/vision';
import { usageRouter } from './routes/usage';
import { betaPublicRouter } from './routes/beta';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();
  
  // Configure CORS to allow requests from the landing page and Figma
  app.use(cors({
    origin: [
      'https://arreglo.ai',
      'https://www.arreglo.ai',
      'https://www.figma.com',
      'https://figma.com',
      /^https:\/\/.*\.figma\.com$/,
      /^https:\/\/.*\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '10mb' }));

  app.use('/health', healthRouter);
  
  // Public beta signup endpoint (no auth required)
  app.use('/v1/beta', betaPublicRouter);
  
  // Protected endpoints (require auth)
  app.use('/v1', authMiddleware);
  app.use('/v1/arrangements', arrangementsRouter);
  app.use('/v1/vision', visionRouter);
  app.use('/v1/usage', usageRouter);

  return app;
}
