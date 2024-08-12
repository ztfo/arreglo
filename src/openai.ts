import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateArrangement(genre: string, length: number, tempo: number) {
    const prompt = `
    Generate a ${genre} song arrangement with a length of ${length} bars and a tempo of ${tempo} BPM. 
    Include the following elements: kicks, hi-hats, bass, melodies. Also, suggest transition elements like risers, buildups, and swells at appropriate points in the arrangement.`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/engines/davinci-codex/completions',
            {
                prompt,
                max_tokens: 200,
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
    const patterns: any = {};
    const transitions: string[] = [];
    
    const lines = data.split('\n');
    for (const line of lines) {
        if (line.startsWith("Transitions:")) {
            const trans = line.replace("Transitions:", "").trim();
            transitions.push(...trans.split(',').map(t => t.trim()));
        } else {
            const [instrument, pattern] = line.split(':');
            if (instrument && pattern) {
                patterns[instrument.trim()] = pattern.trim();
            }
        }
    }

    return { patterns, transitions };
}