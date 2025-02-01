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

Consider these pattern meanings when arranging:
- Names ending in "4x" indicate four-on-the-floor patterns (steady beats on every quarter note)
- "bassline - chords" follows chord progressions, ideal for verses and choruses
- "bassline - melody" is more melodic, good for hooks and builds
- "bassline - buildup" indicates ascending or intensifying patterns
- Names with "offbeat" should emphasize off-beat rhythms
- Names with "solo" indicate lead/featured moments
- Names with "chords" should follow harmonic progressions
- Names with "sample" can be used sparsely for impact

For each section, provide the information in this format:
SECTION: [section name]
DURATION: [number of bars]
INSTRUMENT: [instrument name]
BARS: [comma-separated list of bar numbers]
END_INSTRUMENT

Example:
SECTION: Intro
DURATION: 8
INSTRUMENT: kick - 4x
BARS: 1,2,3,4,5,6,7,8  # Steady four-on-the-floor pattern
END_INSTRUMENT
INSTRUMENT: bassline - chords
BARS: 5,6,7,8  # Entering later to build tension
END_INSTRUMENT
END_SECTION

Arrange instruments based on their pattern types:
- Use "4x" patterns consistently in dance sections
- Introduce "chord" patterns gradually in verses
- Feature "solo" instruments in bridges or breakdowns
- Use "buildup" patterns in pre-chorus or build-up sections
- Layer "offbeat" patterns with main beats for groove
- Place "sample" patterns strategically for impact

Separate each section with three dashes (---).
${creativity >= 4 ? 'Feel free to use unconventional patterns and transitions while respecting instrument roles.' : 
  creativity >= 3 ? 'Balance between traditional and innovative elements while maintaining pattern consistency.' :
  'Stick to established genre conventions and pattern meanings.'}`;
} 