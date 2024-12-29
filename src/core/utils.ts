import { ArrangementData, SongSection } from './types';

export function parseArrangement(response: string, title: string): ArrangementData {
    const sections: SongSection[] = [];
    let currentBar = 0;
    
    const lines = response.split('\n').filter(line => line.trim() !== '');
    let currentSection: SongSection | null = null;
    
    lines.forEach(line => {
        const sectionMatch = line.match(/^(Intro|Verse|Chorus|Bridge|Outro|Break):/i);
        if (sectionMatch) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                name: sectionMatch[1],
                startBar: currentBar,
                duration: 0,
                patterns: {}
            };
        } else if (currentSection && line.includes(':')) {
            const [instrument, pattern] = line.split(':').map(s => s.trim());
            const barMatch = pattern.match(/(\d+)\s*bars?/i);
            if (barMatch) {
                const bars = parseInt(barMatch[1]);
                currentSection.duration = Math.max(currentSection.duration, bars);
                currentSection.patterns[instrument] = pattern;
            }
        }
    });
    
    if (currentSection) {
        sections.push(currentSection);
    }

    return {
        title,
        sections,
        rawResponse: response
    };
} 