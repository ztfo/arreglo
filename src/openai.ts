import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateArrangement(genre: string, length: number, tempo: number) {
    const prompt = `
    Generate a ${genre} song arrangement with a length of ${length} bars and a tempo of ${tempo} BPM. 
    Include the following elements: kicks, hi-hats, bass, melodies, and suggest transition elements like risers, buildups, and swells.`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/engines/davinci-codex/completions',
            {
                prompt,
                max_tokens: 150,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data.choices[0].text;
        return parseArrangement(data);
    } catch (error) {
        console.error('Error generating arrangement:', error);
        throw error;
    }
}

function parseArrangement(data: string) {
    return {
        patterns: {
            kicks: "4-on-the-floor",
            hihats: "every-8th-note",
            bass: "syncopated",
            melodies: "arpeggio"
        },
        transitions: ["riser at bar 64", "buildup at bar 120", "swell at bar 128"]
    };
}