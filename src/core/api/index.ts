import { callOpenAI } from './openai';
import { ApiConfig } from '../types';

export async function generateArrangement(config: ApiConfig, prompt: string): Promise<string> {
    if (config.OPENAI_API_KEY) {
        return await callOpenAI(config.OPENAI_API_KEY, prompt);
    }
    throw new Error('OpenAI API key not configured');
} 

// Stubbed backend client (disabled until backend is live). When ready, migrate calls:
// import { generateArrangement as generateFromBackend } from './backend';
// export async function generateArrangementViaBackend(songData: SongData): Promise<string> {
//   return generateFromBackend(songData);
// }