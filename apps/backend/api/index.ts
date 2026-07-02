import { createApp } from '../src/app.js';

// Create a full Express app with our routes
const app = createApp();

// Let Express handle body parsing itself — @vercel/node's default parser
// would consume the stream and break Stripe webhook signature verification
export const config = { api: { bodyParser: false } };

// Export a Serverless Function handler for Vercel
// Express apps handle responses through the res object, so we don't return anything
export default function handler(req: any, res: any) {
  app(req, res);
}
