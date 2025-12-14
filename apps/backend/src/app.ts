import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import { arrangementsRouter } from './routes/arrangements.js';
import { visionRouter } from './routes/vision.js';
import { usageRouter } from './routes/usage.js';
import { betaPublicRouter } from './routes/beta.js';
import { healthRouter } from './routes/health.js';

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
  
  // Protected endpoints (require auth) - apply middleware to each protected route
  app.use('/v1/arrangements', authMiddleware, arrangementsRouter);
  app.use('/v1/vision', authMiddleware, visionRouter);
  app.use('/v1/usage', authMiddleware, usageRouter);

  return app;
}
