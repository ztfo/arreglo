import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const usageRouter = Router();

usageRouter.get('/', async (req, res) => {
  try {
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
        totalActions: usageSummary.total_actions || 0,
        arrangementsGenerated: usageSummary.arrangements_generated || 0,
        imagesAnalyzed: usageSummary.images_analyzed || 0,
        totalCostCents: usageSummary.total_cost_cents || 0
      } : {
        totalActions: 0,
        arrangementsGenerated: 0,
        imagesAnalyzed: 0,
        totalCostCents: 0
      }
    });
  } catch (err: any) {
    console.error('usage error', err);
    return res.status(500).json({ error: 'Failed to fetch usage information' });
  }
});
