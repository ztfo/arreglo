import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateArrangement(genre: string, length: number, tempo: number) {
    const prompt = `
    Generate a ${genre} song arrangement with a length of ${length} bars and a tempo of ${tempo} BPM.
    Format the response exactly like this example:

    Kick: 4-on-floor pattern for 16 bars
    Hi-hat: Open hat on offbeats for 8 bars
    Bass: Rolling bassline with quarter notes for 16 bars
    Melody: Atmospheric pad progression for 32 bars
    Transition: Rising white noise sweep at bar 24
    Transition: Filter cutoff buildup at bar 48

    Include patterns for these instruments: kicks, hi-hats, bass, melodies. 
    Add transition elements like risers, buildups, and swells at appropriate points.`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating arrangement:', error);
        throw error;
    }
}