import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.OPENAI_API_KEY) {
  console.warn('[warn] OPENAI_API_KEY is not set');
}

export async function generateArrangementWithOpenAI(prompt: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gpt-5.5',
    messages: [{ role: 'user', content: prompt }],
    // GPT-5 family: no custom temperature; reasoning tokens count against this limit
    max_completion_tokens: 8000,
    reasoning_effort: 'low'
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function analyzeImageWithOpenAI(base64Image: string): Promise<string[]> {
  const res = await client.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract DAW track/instrument names; return comma-separated.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }
    ],
    max_completion_tokens: 2000,
    reasoning_effort: 'low'
  });

  const text = res.choices[0]?.message?.content ?? '';
  return text.split(',').map(s => s.trim()).filter(Boolean);
}
