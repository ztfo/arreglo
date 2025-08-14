import { Router } from 'express';
import { checkAndDecrementCredit, logUsage } from '../services/credits';
import { generateArrangementWithOpenAI } from '../services/ai';
import { createArrangementPromptFromSong } from '../services/prompts';
import { SongData } from '../types';

export const arrangementsRouter = Router();

arrangementsRouter.post('/generate', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { songData, prompt } = req.body || {};
    if (!prompt && !songData) return res.status(400).json({ error: 'Missing prompt or songData' });

    await checkAndDecrementCredit(user.id);

    const start = Date.now();
    const finalPrompt = prompt || createArrangementPromptFromSong(songData as SongData);
    const arrangement = await generateArrangementWithOpenAI(finalPrompt);
    const ms = Date.now() - start;

    await logUsage(user.id, 'arrangement_generation', { ms });
    return res.json({ arrangement });
  } catch (err: any) {
    if (String(err?.message).includes('INSUFFICIENT_CREDITS')) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    console.error('generate error', err);
    return res.status(500).json({ error: 'Failed to generate arrangement' });
  }
});
