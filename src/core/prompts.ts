export function createArrangementPrompt(genre: string, length: string, tempo: string, instruments: string[]): string {
    return `
Generate a ${genre} song arrangement with a length of ${length} bars and a tempo of ${tempo} BPM.
Include these sections: Intro, Verse, Chorus, Bridge, Outro
Format each section like this:

Intro:
Kick: 4-on-floor pattern for 16 bars
Hi-hat: Open hat on offbeats for 8 bars
Bass: Rolling bassline for 16 bars

Include patterns for these instruments: ${instruments.join(', ')}
Add transition elements between sections.
Make sure each pattern specifies the number of bars.`;
} 