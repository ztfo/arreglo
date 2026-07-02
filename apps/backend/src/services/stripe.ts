import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string | undefined;
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
if (!stripeSecretKey) {
  console.warn('[warn] STRIPE_SECRET_KEY is not set');
}

export interface CreditPack {
  credits: number;
  amountCents: number;
  name: string;
}

// Server-side source of truth for purchasable packs (inline price_data,
// no Stripe dashboard products required)
export const CREDIT_PACKS: Record<string, CreditPack> = {
  small: { credits: 50, amountCents: 500, name: 'Arreglo — 50 credits' },
  medium: { credits: 200, amountCents: 1500, name: 'Arreglo — 200 credits' },
  large: { credits: 500, amountCents: 4000, name: 'Arreglo — 500 credits' }
};
