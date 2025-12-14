import { Router, Request, Response } from 'express';
import { analyzeImageWithOpenAI } from '../services/ai.js';
import { logUsage } from '../services/credits.js';

export const visionRouter = Router();

visionRouter.post('/extract-tracks', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { base64Image } = req.body || {};
    if (!base64Image) return res.status(400).json({ error: 'Missing base64Image' });

    const start = Date.now();
    const trackNames = await analyzeImageWithOpenAI(base64Image);
    const ms = Date.now() - start;

    // Log usage (free, but still tracked)
    await logUsage(user.id, 'image_analysis', { ms, trackCount: trackNames.length });

    return res.json({ 
      trackNames,
      analysisTime: ms,
      trackCount: trackNames.length
    });
  } catch (err: any) {
    console.error('vision error', err);
    
    // Handle specific OpenAI errors
    if (err?.message?.includes('rate_limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (err?.message?.includes('invalid_image')) {
      return res.status(400).json({ error: 'Invalid image format. Please provide a valid image.' });
    }
    
    return res.status(500).json({ error: 'Failed to analyze image. Please try again.' });
  }
});
