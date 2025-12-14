import { createApp } from '../src/app.js';

// Create a full Express app with our routes
const app = createApp();

// Export a Serverless Function handler for Vercel
// Express apps handle responses through the res object, so we don't return anything
export default function handler(req: any, res: any) {
  app(req, res);
}
