import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === 'true';
const DEV_USER_ID = process.env.DEV_USER_ID || '';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (DEV_AUTH_BYPASS && DEV_USER_ID) {
    (req as any).user = { id: DEV_USER_ID, email: 'dev@local' };
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice('Bearer '.length);

  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

  (req as any).user = { id: data.user.id, email: data.user.email };
  next();
}
