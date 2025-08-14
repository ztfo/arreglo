import express from 'express';
import cors from 'cors';
import { createApp } from '../src/app';

// Create a full Express app with our routes
const app = createApp();

// Export a Serverless Function handler for Vercel
export default function handler(req: any, res: any) {
  return app(req, res);
}
