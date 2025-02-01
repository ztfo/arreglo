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

Instruments: ${usedInstruments.join(', ')}

For each section, provide the information in this format:
SECTION: [section name]
DURATION: [number of bars]
INSTRUMENT: [instrument name]
BARS: [comma-separated list of bar numbers]
END_INSTRUMENT

Example:
SECTION: Intro
DURATION: 8
INSTRUMENT: kick
BARS: 1,2,3,4,5,6,7,8
END_INSTRUMENT
INSTRUMENT: bass
BARS: 5,6,7,8
END_INSTRUMENT
END_SECTION

Separate each section with three dashes (---).
${creativity >= 4 ? 'Feel free to use unconventional patterns and transitions.' : 
  creativity >= 3 ? 'Balance between traditional and innovative elements.' :
  'Stick to established genre conventions and patterns.'}`;
} 