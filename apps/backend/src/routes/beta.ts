import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const betaPublicRouter = Router();

const SIGNUP_LIMIT_PER_IP_HOUR = 3;
const SIGNUP_LIMIT_GLOBAL_HOUR = 100;

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (first || req.socket.remoteAddress || '').trim();
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[warn] TURNSTILE_SECRET_KEY not set; skipping captcha verification');
    return true;
  }
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip })
    });
    const data = (await resp.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return false;
  }
}

// Public endpoint - no auth required for signups
betaPublicRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { email, source = 'website', metadata = {}, turnstileToken, company } = req.body || {};

    // Honeypot: humans never see this field — pretend success, store nothing
    if (typeof company === 'string' && company.trim() !== '') {
      return res.json({ success: true, message: 'Thanks for signing up! We\'ll be in touch soon.' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const ip = clientIp(req);

    if (!(await verifyTurnstile(turnstileToken || '', ip))) {
      return res.status(400).json({ error: 'Verification failed. Please try again.' });
    }

    // Durable rate limit: count recent rows instead of in-memory state,
    // which doesn't survive across serverless instances
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const countSignupsSince = (since: string, fromIp?: string) => {
      let q = supabase!.from('beta_signups').select('id', { count: 'exact', head: true }).gte('created_at', since);
      if (fromIp) q = q.eq('ip', fromIp);
      return q.then(({ count }) => count ?? 0);
    };
    const [ipCount, globalCount] = await Promise.all([
      ip ? countSignupsSince(hourAgo, ip) : Promise.resolve(0),
      countSignupsSince(hourAgo)
    ]);
    if (ipCount >= SIGNUP_LIMIT_PER_IP_HOUR) {
      return res.status(429).json({ error: 'Too many signups from this address. Try again later.' });
    }
    if (globalCount >= SIGNUP_LIMIT_GLOBAL_HOUR) {
      return res.status(429).json({ error: 'Signups are temporarily paused. Try again later.' });
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
        ip: ip || null,
        metadata: {
          ...metadata,
          userAgent: req.headers['user-agent']
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


