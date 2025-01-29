export function createArrangementPrompt(
    title: string,
    genre?: string,
    style?: string,
    customSections?: string,
    instruments?: string[]
): string {
    const defaultInstruments = ['drums', 'bass', 'guitar', 'keys'];
    const usedInstruments = instruments || defaultInstruments;

    return `As a music arrangement expert, create a detailed arrangement for a song with these details:

Title: ${title}
${genre ? `Genre: ${genre}` : 'Genre: Modern'}
${style ? `Style: ${style}` : ''}

${customSections 
    ? `Use these sections: ${customSections}`
    : 'Recommend appropriate sections based on the genre and style'}

For each section:
1. Specify the number of bars (based on genre conventions)
2. Define patterns for these instruments: ${usedInstruments.join(', ')}
3. For each instrument in a section, specify:
   - A description of what it plays ("pattern")
   - Exactly which bars it plays in ("bars")

Format your response as a JSON object like this:
{
  "sections": [
    {
      "name": "Intro",
      "duration": 8,
      "instruments": {
        "drums": {
          "pattern": "basic beat",
          "bars": [3, 4, 5, 6] // Only plays in bars 3-6
        },
        "bass": {
          "pattern": "simple root notes",
          "bars": [1, 2, 3, 4] // Only plays in bars 1-4
        }
      }
    }
  ]
}

Example of a complete arrangement:
{
  "sections": [
    {
      "name": "Intro",
      "duration": 4,
      "instruments": {
        "drums": {
          "pattern": "basic beat",
          "bars": [3, 4] // Only plays in last 2 bars
        },
        "bass": {
          "pattern": "simple root notes",
          "bars": [1, 2, 3, 4] // Plays throughout
        }
      }
    },
    {
      "name": "Verse",
      "duration": 8,
      "instruments": {
        "drums": {
          "pattern": "full beat",
          "bars": [1, 2, 3, 4, 5, 6, 7, 8] // Plays throughout
        },
        "bass": {
          "pattern": "following chord progression",
          "bars": [2, 4, 6, 8] // Plays every other bar
        }
      }
    }
  ]
}

Consider typical ${genre || 'modern'} arrangement practices and ensure smooth transitions between sections.
For each instrument, specify exactly which bars it plays using bar numbers (starting from 1 for each section).
Your response must be a valid JSON object with no comments or additional text.
Do not include any trailing commas in arrays or objects.`;
} 