import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function checkAndDecrementCredit(userId: string): Promise<void> {
  const { error } = await supabase.rpc('decrement_credit_balance', { p_user_id: userId, p_amount: 1 });
  if (error) throw new Error(error.message || 'INSUFFICIENT_CREDITS');
}

export async function logUsage(userId: string, action: string, meta: any = {}, tokensIn = 0, tokensOut = 0, costCents = 0) {
  const { error } = await supabase.rpc('log_usage', {
    p_user_id: userId,
    p_action: action,
    p_tokens_in: tokensIn,
    p_tokens_out: tokensOut,
    p_cost_cents: costCents,
    p_meta: meta
  });
  if (error) console.error('log_usage error', error);
}
