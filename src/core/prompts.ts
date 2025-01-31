export function createArrangementPrompt(
    title: string,
    genre?: string,
    style?: string,
    selectedSections?: string[],
    instruments?: string[],
    creativity: number = 2
): string {
    const defaultInstruments = ['drums', 'bass', 'guitar', 'keys'];
    const usedInstruments = instruments || defaultInstruments;

    // Adjust the temperature based on creativity level (0-5)
    const creativityDescription = creativity <= 1 ? 'traditional'
        : creativity <= 2 ? 'balanced'
        : creativity <= 3 ? 'modern'
        : creativity <= 4 ? 'innovative'
        : 'experimental';

    return `As a music arrangement expert, create a ${creativityDescription} arrangement for a song with these details:

Title: ${title}
${genre ? `Genre: ${genre}` : 'Genre: Modern'}
${style ? `Style: ${style}` : ''}
Creativity Level: ${creativityDescription} (${creativity}/5)

${selectedSections && selectedSections.length > 0
    ? `Use these sections in order: ${selectedSections.join(', ')}`
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

Consider that this is a ${creativityDescription} arrangement for the ${genre || 'modern'} genre.
${creativity >= 4 ? 'Feel free to use unconventional patterns and transitions.' : 
  creativity >= 3 ? 'Balance between traditional and innovative elements.' :
  'Stick to established genre conventions and patterns.'}

Your response must be a valid JSON object with no comments or additional text.
Do not include any trailing commas in arrays or objects.`;
} 