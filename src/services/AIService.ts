import { ApiConfig } from '../core/types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function generateArrangement(config: ApiConfig, prompt: string): Promise<string> {
    // Choose API based on config
    if (config.PREFERRED_API === 'anthropic') {
        if (!config.ANTHROPIC_API_KEY) {
            throw new Error('Anthropic API key not configured');
        }
        return await generateWithAnthropic(prompt, config.ANTHROPIC_API_KEY);
    } else {
        if (!config.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }
        return await generateWithOpenAI(prompt, config.OPENAI_API_KEY);
    }
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
    });
    return response.choices[0].message.content || '';
}

async function generateWithAnthropic(prompt: string, apiKey: string): Promise<string> {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });
    
    // Type checking for response structure
    if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new Error('Invalid response format: missing or empty content array');
    }

    const firstContent = response.content[0];
    if (!firstContent || typeof firstContent !== 'object') {
        throw new Error('Invalid response format: first content item is not an object');
    }

    if (!('text' in firstContent) || typeof firstContent.text !== 'string') {
        throw new Error('Invalid response format: missing or invalid text property');
    }
    
    return firstContent.text;
}

// Comment out or disable Supabase initialization
export class AIService {
    private apiKey: string;

    constructor(config: ApiConfig) {
        this.apiKey = config.OPENAI_API_KEY;
    }

    async generateArrangement(prompt: string): Promise<string> {
        // Remove any analytics/data collection
        try {
            // Just handle the AI generation
            const response = await this.makeRequest(prompt);
            return response;
        } catch (error) {
            console.error('Error generating arrangement:', error);
            throw error;
        }
    }

    private async makeRequest(prompt: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Remove or comment out analytics methods
    // private async logArrangement(...) { }
    // private async collectAnonymousData(...) { }
} 