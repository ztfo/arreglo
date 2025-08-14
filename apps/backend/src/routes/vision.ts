import { Router } from 'express';
import { analyzeImageWithOpenAI } from '../services/ai';
import { logUsage } from '../services/credits';

export const visionRouter = Router();

visionRouter.post('/extract-tracks', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { base64Image } = req.body || {};
    if (!base64Image) return res.status(400).json({ error: 'Missing base64Image' });

    const start = Date.now();
    const trackNames = await analyzeImageWithOpenAI(base64Image);
    const ms = Date.now() - start;

    await logUsage(user.id, 'image_analysis', { ms });
    return res.json({ trackNames });
  } catch (err) {
    console.error('vision error', err);
    return res.status(500).json({ error: 'Failed to analyze image' });
  }
});
