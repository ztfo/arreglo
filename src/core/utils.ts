import { ArrangementData, SongSection } from './types';

export function parseArrangement(response: string, title: string): ArrangementData {
    try {
        // Try to parse the response as JSON first
        let parsedResponse;
        try {
            // First try parsing the response as-is
            try {
                parsedResponse = JSON.parse(response);
            } catch {
                // If that fails, try cleaning up the response
                let cleanedResponse = response
                    // Remove any text before the first {
                    .substring(response.indexOf('{'))
                    // Find the last complete section
                    .replace(/,\s*"name":[^}]*$/, '')
                    // Remove any text after the last complete section
                    .replace(/}\s*[^}\]]*$/, '}]}')
                    // Fix any trailing commas before closing brackets
                    .replace(/,(\s*[}\]])/g, '$1')
                    // Ensure the response is properly closed
                    .replace(/}([^}\]]*$)/, '}}');
                
                console.log('Cleaned JSON response:', cleanedResponse);
                parsedResponse = JSON.parse(cleanedResponse);
            }
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            console.error('Raw response:', response);
            throw new Error('Invalid response format from API');
        }

        // Validate the response structure
        if (!parsedResponse.sections || !Array.isArray(parsedResponse.sections)) {
            console.error('Invalid response structure:', parsedResponse);
            throw new Error('Invalid response format: missing sections array');
        }

        // Convert the response sections to our internal format
        const sections = parsedResponse.sections.map((section: { 
            name: string; 
            duration: number; 
            instruments: Record<string, {
                pattern: string;
                bars: number[];
            }>;
        }) => {
            if (!section.name || typeof section.duration !== 'number' || !section.instruments) {
                console.error('Invalid section format:', section);
                throw new Error('Invalid section format: missing required fields');
            }

            // Convert the new format to our internal format
            const patterns: Record<string, string> = {};
            const barPatterns: Record<string, boolean[]> = {};

            Object.entries(section.instruments).forEach(([instrument, data]) => {
                patterns[instrument] = data.pattern;
                // Create an array of booleans based on which bars the instrument plays in
                barPatterns[instrument] = new Array(section.duration).fill(false);
                data.bars.forEach(barNumber => {
                    if (barNumber > 0 && barNumber <= section.duration) {
                        barPatterns[instrument][barNumber - 1] = true;
                    }
                });
            });

            return {
                name: section.name,
                duration: section.duration,
                patterns,
                instruments: section.instruments,
                barPatterns
            };
        });

        return {
            title,
            sections,
            rawResponse: response
        };
    } catch (error) {
        console.error('Error parsing arrangement:', error);
        throw error;
    }
}