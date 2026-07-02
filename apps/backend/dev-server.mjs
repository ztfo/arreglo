// Local dev server — runs the same Express app Vercel wraps in api/index.ts
// Usage: pnpm run dev (builds then serves on :3000 with .env loaded)
import { createApp } from './dist/src/app.js';

const port = process.env.PORT || 3000;
createApp().listen(port, () => {
  console.log(`arreglo backend listening on http://localhost:${port}`);
});
