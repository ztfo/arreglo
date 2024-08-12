import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { CONFIG } from './config';

figma.showUI(__html__);

interface ApiKeys {
  anthropic: string;
  openai: string;
  preferred: 'anthropic' | 'openai';
}

async function getApiKeys(): Promise<ApiKeys> {
  if (figma.clientStorage) {
    const anthropicKey = await figma.clientStorage.getAsync('anthropic_api_key') || CONFIG.ANTHROPIC_API_KEY;
    const openaiKey = await figma.clientStorage.getAsync('openai_api_key') || CONFIG.OPENAI_API_KEY;
    const preferred = (await figma.clientStorage.getAsync('preferred_api') as 'anthropic' | 'openai') || CONFIG.PREFERRED_API;
    return { anthropic: anthropicKey, openai: openaiKey, preferred };
  }
  // fallback for development
  return {
    anthropic: CONFIG.ANTHROPIC_API_KEY,
    openai: CONFIG.OPENAI_API_KEY,
    preferred: CONFIG.PREFERRED_API
  };
}

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'create-layout') {
        await createSongLayout(msg.data);
    }
};

function parseInstrumentPatterns(input: string) {
    const patterns = input.split(',').map(pattern => {
        const [instrument, bars] = pattern.trim().split(':').map(str => str.trim());
        return { instrument, bars: parseInt(bars, 10) };
    });

    return patterns;
}

interface Arrangement {
    patterns: Record<string, string>;
    transitions: string[];
    structure: { name: string; start: number; end: number }[];
}

async function generateArrangement(genre: string, length: number, tempo: number): Promise<Arrangement> {
    const keys = await getApiKeys();
    let aiResponse: string;
  
    const prompt = `Generate a detailed song arrangement for a ${genre} song that is ${length} seconds long with a tempo of ${tempo} BPM. Please provide:
  
  1. Overall song structure with timestamps (in seconds)
  2. Instrument patterns (which instruments play and for how many bars)
  3. Transition elements with timestamps (in seconds)
  
  Format the response as follows:
  Structure:
  [Section Name]: [Start Time] - [End Time]
  
  Patterns:
  [Instrument]: [Pattern Description]
  
  Transitions:
  [Transition Type]: [Timestamp]`;
  
    if (keys.preferred === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: keys.anthropic });
      const completion = await anthropic.completions.create({
        model: "claude-2.1",
        prompt: prompt,
        max_tokens_to_sample: 1000,
      });
      aiResponse = completion.completion;
    } else {
      const openai = new OpenAI({ apiKey: keys.openai });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      aiResponse = response.choices[0].message.content || '';
    }
  
    const sections = aiResponse.split('\n\n');
    const arrangement: Arrangement = {
      patterns: {},
      transitions: [],
      structure: []
    };
  
    for (const section of sections) {
      if (section.startsWith('Structure:')) {
        const structureLines = section.split('\n').slice(1);
        for (const line of structureLines) {
          const [name, times] = line.split(': ');
          const [start, end] = times.split(' - ').map(t => parseInt(t, 10));
          arrangement.structure.push({ name, start, end });
        }
      } else if (section.startsWith('Patterns:')) {
        const patternLines = section.split('\n').slice(1);
        for (const line of patternLines) {
          const [instrument, pattern] = line.split(': ');
          arrangement.patterns[instrument] = pattern;
        }
      } else if (section.startsWith('Transitions:')) {
        const transitionLines = section.split('\n').slice(1);
        arrangement.transitions = transitionLines.map(line => line.trim());
      }
    }
  
    return arrangement;
  }

  async function createSongLayout(data: { genre: string, length: number, tempo: number, instrumentPatterns: string }) {
    const { genre, length, tempo, instrumentPatterns } = data;
  
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    } catch (error) {
      console.error("Failed to load font:", error);
      figma.notify("Error: Could not load font. Please try again.");
      return;
    }
  
    const arrangement = await generateArrangement(genre, length, tempo);
  
    const shapeHeight = 50;
    const shapeWidth = 200;
    const spacing = 20;
  
    let xPos = 0;
    let yPos = 0;
  
    // song structure
    for (const section of arrangement.structure) {
      const sectionWidth = (section.end - section.start) * 2; // 2 pixels per second
      const shape = figma.createRectangle();
      shape.resize(sectionWidth, shapeHeight);
      shape.x = xPos;
      shape.y = yPos;
      shape.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
  
      const text = figma.createText();
      text.characters = `${section.name} (${section.start}s - ${section.end}s)`;
      text.fontSize = 12;
      text.x = xPos + 5;
      text.y = yPos + 5;
  
      figma.currentPage.appendChild(shape);
      figma.currentPage.appendChild(text);
  
      xPos += sectionWidth + spacing;
    }
  
    yPos += shapeHeight + spacing;
    xPos = 0;
  
    // instrument patterns
    for (const [instrument, pattern] of Object.entries(arrangement.patterns)) {
      const shape = figma.createRectangle();
      shape.resize(shapeWidth, shapeHeight);
      shape.x = xPos;
      shape.y = yPos;
      shape.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.8, b: 0.3 } }];
  
      const text = figma.createText();
      text.characters = `${instrument}: ${pattern}`;
      text.fontSize = 12;
      text.x = xPos + 5;
      text.y = yPos + 5;
  
      figma.currentPage.appendChild(shape);
      figma.currentPage.appendChild(text);
  
      yPos += shapeHeight + spacing;
    }
  
    // transition elements
    for (const transition of arrangement.transitions) {
      const transitionShape = figma.createEllipse();
      transitionShape.resize(shapeHeight, shapeHeight);
      transitionShape.x = xPos;
      transitionShape.y = yPos;
      transitionShape.fills = [{ type: 'SOLID', color: { r: 1, g: 0.34, b: 0.2 } }];
  
      const transitionText = figma.createText();
      transitionText.characters = transition;
      transitionText.fontSize = 12;
      transitionText.x = xPos + shapeHeight + 5;
      transitionText.y = yPos + shapeHeight / 2 - 6;
  
      figma.currentPage.appendChild(transitionShape);
      figma.currentPage.appendChild(transitionText);
  
      yPos += shapeHeight + spacing;
    }
  
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
  
    figma.notify("AI-powered layout with transitions created!");
  }