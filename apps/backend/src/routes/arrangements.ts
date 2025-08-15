import { Router } from 'express';
import { checkAndDecrementCredit, logUsage } from '../services/credits';
import { generateArrangementWithOpenAI } from '../services/ai';
import { createArrangementPromptFromSong } from '../services/prompts';
import { saveArrangement, getUserArrangements, getArrangement } from '../services/storage';
import { SongData } from '../types';

export const arrangementsRouter = Router();

arrangementsRouter.post('/generate', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { songData, prompt } = req.body || {};
    if (!prompt && !songData) return res.status(400).json({ error: 'Missing prompt or songData' });

    // Check and decrement credits
    await checkAndDecrementCredit(user.id);

    const start = Date.now();
    const finalPrompt = prompt || createArrangementPromptFromSong(songData as SongData);
    const arrangement = await generateArrangementWithOpenAI(finalPrompt);
    const ms = Date.now() - start;

    // Save arrangement to database
    const arrangementId = await saveArrangement({
      userId: user.id,
      title: songData?.title || 'Generated Arrangement',
      genre: songData?.genre,
      tempo: songData?.tempo,
      lengthBars: songData?.length,
      creativity: songData?.creativity,
      sections: songData?.selectedSections || [],
      rawResponse: arrangement
    });

    // Log usage
    await logUsage(user.id, 'arrangement_generation', { ms, arrangementId });

    return res.json({ 
      arrangement,
      id: arrangementId,
      creditsUsed: 1,
      generationTime: ms
    });
  } catch (err: any) {
    if (String(err?.message).includes('INSUFFICIENT_CREDITS')) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    console.error('generate error', err);
    return res.status(500).json({ error: 'Failed to generate arrangement' });
  }
});

// Get user's arrangements
arrangementsRouter.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const arrangements = await getUserArrangements(user.id);
    return res.json({ arrangements });
  } catch (err) {
    console.error('get arrangements error', err);
    return res.status(500).json({ error: 'Failed to fetch arrangements' });
  }
});

// Get specific arrangement
arrangementsRouter.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const arrangement = await getArrangement(id, user.id);
    
    if (!arrangement) {
      return res.status(404).json({ error: 'Arrangement not found' });
    }

    return res.json({ arrangement });
  } catch (err) {
    console.error('get arrangement error', err);
    return res.status(500).json({ error: 'Failed to fetch arrangement' });
  }
});
