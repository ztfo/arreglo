import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const usageRouter = Router();

usageRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    // Get user profile with credit balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credit_balance, plan, display_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw new Error(profileError.message);

    // Get usage summary from the view
    const { data: usageSummary, error: usageError } = await supabase
      .from('v_usage_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.warn('Usage summary error:', usageError);
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name,
        plan: profile?.plan || 'free',
        creditBalance: profile?.credit_balance || 0
      },
      usage: usageSummary ? {
        arrangementsGenerated: usageSummary.total_arrangements || 0,
        imagesAnalyzed: usageSummary.total_image_analyses || 0,
        totalCostCents: usageSummary.total_cost_cents || 0,
        firstUse: usageSummary.first_use,
        lastUse: usageSummary.last_use
      } : {
        arrangementsGenerated: 0,
        imagesAnalyzed: 0,
        totalCostCents: 0,
        firstUse: null,
        lastUse: null
      }
    });
  } catch (err: any) {
    console.error('usage error', err);
    return res.status(500).json({ error: 'Failed to fetch usage information' });
  }
});
