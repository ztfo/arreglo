import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe, CREDIT_PACKS } from '../services/stripe.js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://arreglo.ai';
const SUCCESS_URL = `${APP_BASE_URL}/checkout.html?status=success&session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${APP_BASE_URL}/checkout.html?status=cancel`;

export const billingRouter = Router();

billingRouter.get('/packs', (_req: Request, res: Response) => {
  res.json({
    packs: Object.entries(CREDIT_PACKS).map(([id, p]) => ({
      id,
      credits: p.credits,
      amountCents: p.amountCents,
      name: p.name
    }))
  });
});

billingRouter.post('/checkout-session', async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Billing not configured' });
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    const user = (req as any).user as { id: string; email?: string };
    const pack = CREDIT_PACKS[req.body?.pack];
    if (!pack) return res.status(400).json({ error: 'Unknown credit pack' });

    // Reuse the user's Stripe customer, or create one and persist it
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: pack.amountCents,
          product_data: { name: pack.name }
        },
        quantity: 1
      }],
      metadata: {
        user_id: user.id,
        credits: String(pack.credits)
      },
      client_reference_id: user.id,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('checkout-session error:', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
});

// Mounted directly in app.ts with express.raw() BEFORE the global JSON
// parser — Stripe signature verification needs the untouched body bytes
export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe) return res.status(500).json({ error: 'Billing not configured' });
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits || '', 10);

    if (session.payment_status === 'paid' && userId && credits > 0) {
      const { data: granted, error } = await supabase.rpc('grant_credits_idempotent', {
        p_user_id: userId,
        p_amount: credits,
        p_stripe_session_id: session.id,
        p_stripe_event_id: event.id,
        p_amount_cents: session.amount_total
      });
      if (error) {
        console.error('grant_credits_idempotent failed:', error);
        // 500 so Stripe retries — the grant is idempotent
        return res.status(500).json({ error: 'Credit grant failed' });
      }
      if (granted === false) {
        console.log(`Duplicate webhook for session ${session.id}, grant skipped`);
      }
    } else {
      console.warn(`checkout.session.completed without valid metadata/payment: ${session.id}`);
    }
  }

  return res.json({ received: true });
}
