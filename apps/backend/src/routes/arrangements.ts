import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { checkAndDecrementCredit, logUsage } from '../services/credits';
import { generateArrangementWithOpenAI } from '../services/ai';
import { createArrangementPromptFromSong } from '../services/prompts';
import { saveArrangement, getUserArrangements, getArrangement } from '../services/storage';
import { SongData } from '../types';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const arrangementsRouter = Router();

arrangementsRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { songData, prompt } = req.body || {};
    if (!prompt && !songData) return res.status(400).json({ error: 'Missing prompt or songData' });

    // Atomically check and decrement credits first to prevent race conditions
    // If generation fails, we'll refund the credit
    try {
      await checkAndDecrementCredit(user.id);
    } catch (err: any) {
      if (String(err?.message).includes('INSUFFICIENT_CREDITS')) {
        return res.status(402).json({ error: 'Insufficient credits' });
      }
      throw err;
    }

    // Generate arrangement - if this or saving fails, we need to refund the credit
    let arrangement: string;
    let ms: number;
    let arrangementId: string;
    
    try {
      const start = Date.now();
      const finalPrompt = prompt || createArrangementPromptFromSong(songData as SongData);
      arrangement = await generateArrangementWithOpenAI(finalPrompt);
      ms = Date.now() - start;

      // Save arrangement to database
      arrangementId = await saveArrangement({
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
    } catch (genError) {
      // Generation or saving failed - refund the credit
      if (supabase) {
        try {
          await supabase.rpc('grant_credits', { p_user_id: user.id, p_amount: 1 });
        } catch (refundError) {
          console.error('Failed to refund credit after generation error:', refundError);
        }
      }
      throw genError;
    }

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
arrangementsRouter.get('/', async (req: Request, res: Response) => {
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
arrangementsRouter.get('/:id', async (req: Request, res: Response) => {
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
