import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const betaPublicRouter = Router();

// Public endpoint - no auth required for signups
betaPublicRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { email, source = 'website', metadata = {} } = req.body || {};
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('beta_signups')
      .select('id, email, status, created_at')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // Return success even if already exists (don't reveal if email is in system)
      return res.json({
        success: true,
        message: 'You\'re already on the list!',
        alreadySignedUp: true
      });
    }

    // Insert new signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert({
        email: normalizedEmail,
        source: source,
        status: 'pending',
        metadata: {
          ...metadata,
          userAgent: req.headers['user-agent'],
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }
      })
      .select('id, email, created_at')
      .single();

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') {
        return res.json({
          success: true,
          message: 'You\'re already on the list!',
          alreadySignedUp: true
        });
      }
      throw error;
    }

    return res.json({
      success: true,
      message: 'Thanks for signing up! We\'ll be in touch soon.',
      data: {
        id: data.id,
        email: data.email,
        createdAt: data.created_at
      }
    });
  } catch (err: any) {
    console.error('Beta signup error:', err);
    return res.status(500).json({ 
      error: 'Failed to process signup. Please try again.' 
    });
  }
});


