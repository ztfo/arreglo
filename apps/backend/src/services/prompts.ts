import { SongData } from '../types';

export function createArrangementPromptFromSong(song: SongData): string {
  const patterns = (song.patterns || []).map(p => p.name);
  const sections = song.selectedSections || [];
  const creativity = song.creativity ?? 3;
  const creativityDesc = creativity <= 1 ? 'traditional' : creativity <= 2 ? 'balanced' : creativity <= 3 ? 'modern' : creativity <= 4 ? 'innovative' : 'experimental';

  return `Create a professional ${song.genre || 'house'} arrangement for dance music.

Title: ${song.title}
Length: ${song.length} bars
Creativity: ${creativityDesc} (${creativity}/5)
${song.tempo ? `Tempo: ${song.tempo} BPM` : ''}

Available Patterns:
${patterns.map(n => `- ${n}`).join('\n')}

${sections.length ? `Requested Sections: ${sections.join(', ')}` : 'Use typical sections for the genre'}

Output format (repeat per section):
SECTION: [name]
DURATION: [bars]
INSTRUMENT: [instrument]
BARS: [comma-separated bar numbers relative to section start]
END_INSTRUMENT
END_SECTION

Important:
- Total bars must be exactly ${song.length} bars
- Use only the provided instrument/pattern names
- Follow genre conventions for energy and structure
- Separate sections with ---`;
}
