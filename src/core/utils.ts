import { ArrangementData, SongSection } from './types';

interface Pattern {
    instrument: string;
    pattern: string;
}

export function parseArrangement(response: string, title: string): ArrangementData {
    const sections: SongSection[] = [];
    const sectionTexts = response.split('---').map(s => s.trim());

    for (const sectionText of sectionTexts) {
        if (!sectionText) continue;

        try {
            const sectionMatch = sectionText.match(/SECTION:\s*(.+?)\n/);
            const durationMatch = sectionText.match(/DURATION:\s*(\d+)/);
            
            if (!sectionMatch || !durationMatch) continue;

            const section: SongSection = {
                name: sectionMatch[1].trim(),
                duration: parseInt(durationMatch[1]),
                instruments: {}
            };

            // Extract all instruments and their bars
            const instrumentBlocks = sectionText.split('INSTRUMENT:')
                .slice(1) // Skip the first empty split
                .map(block => block.trim());

            for (const block of instrumentBlocks) {
                const instrumentMatch = block.match(/^(.+?)\n/);
                const barsMatch = block.match(/BARS:\s*(.+?)(?:\n|$)/);

                if (!instrumentMatch || !barsMatch) continue;

                const instrumentName = instrumentMatch[1].trim();
                const bars = barsMatch[1].split(',')
                    .map(b => parseInt(b.trim()))
                    .filter(b => !isNaN(b));

                if (bars.length > 0) {
                    section.instruments[instrumentName] = bars;
                }
            }

            if (Object.keys(section.instruments).length > 0) {
                sections.push(section);
            }
        } catch (error) {
            console.error('Error parsing section:', error);
            continue;
        }
    }

    if (sections.length === 0) {
        throw new Error('No valid sections found in the response');
    }

    return {
        title,
        sections,
        rawResponse: response
    };
}