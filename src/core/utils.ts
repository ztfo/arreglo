import { ArrangementData, SongSection } from './types';

interface Pattern {
    instrument: string;
    pattern: string;
}

export function parseArrangement(response: string, title: string, requestedLength?: number): ArrangementData {
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

    // Validate total length
    const totalBars = sections.reduce((sum, section) => sum + section.duration, 0);
    if (requestedLength && totalBars !== requestedLength) {
        console.warn(`Generated arrangement length (${totalBars}) differs from requested length (${requestedLength})`);
        
        // Adjust sections to match requested length
        if (sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            const difference = requestedLength - totalBars;
            
            if (difference < 0) {
                // If arrangement is too long, trim the last section
                lastSection.duration = Math.max(4, lastSection.duration + difference); // Ensure minimum 4 bars
            } else {
                // If arrangement is too short, extend the last section
                lastSection.duration += difference;
                
                // Extend the bar numbers for instruments in the last section
                Object.keys(lastSection.instruments).forEach(instrument => {
                    const currentBars = lastSection.instruments[instrument];
                    const additionalBars = Array.from(
                        { length: difference },
                        (_, i) => Math.max(...currentBars) + i + 1
                    );
                    lastSection.instruments[instrument] = [...currentBars, ...additionalBars];
                });
            }
        }
    }

    // Remove or modify the bar number normalization
    let currentBarOffset = 0;
    for (const section of sections) {
        Object.keys(section.instruments).forEach(instrument => {
            // Only normalize the bar numbers relative to section start
            // but DON'T filter out overlapping bars
            section.instruments[instrument] = section.instruments[instrument]
                .map(bar => bar - currentBarOffset)
                .filter(bar => bar >= 1 && bar <= section.duration); // Keep this filter to ensure bars are within section bounds
            
            // Remove this deletion as it's no longer needed
            // if (section.instruments[instrument].length === 0) {
            //     delete section.instruments[instrument];
            // }
        });
        currentBarOffset += section.duration;
    }

    return {
        title,
        sections,
        rawResponse: response
    };
}