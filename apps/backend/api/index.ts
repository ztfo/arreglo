import express from 'express';
import cors from 'cors';
import { createApp } from '../src/app';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const inner = createApp();
app.use(inner);

export default app;
