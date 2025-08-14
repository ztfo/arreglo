import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateArrangementWithOpenAI(prompt: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function analyzeImageWithOpenAI(base64Image: string): Promise<string[]> {
  const res = await client.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract DAW track/instrument names; return comma-separated.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ] as any
      }
    ],
    max_tokens: 1000
  } as any);

  const text = res.choices[0]?.message?.content ?? '';
  return text.split(',').map(s => s.trim()).filter(Boolean);
}
