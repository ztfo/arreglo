import { callOpenAI } from './openai';
import { callAnthropic } from './anthropic';
import { ApiConfig } from '../types';

export async function generateArrangement(config: ApiConfig, prompt: string): Promise<string> {
    if (config.PREFERRED_API === 'openai' && config.OPENAI_API_KEY) {
        return await callOpenAI(config.OPENAI_API_KEY, prompt);
    } else if (config.PREFERRED_API === 'anthropic' && config.ANTHROPIC_API_KEY) {
        return await callAnthropic(config.ANTHROPIC_API_KEY, prompt);
    }
    throw new Error('No valid API configuration found');
} 