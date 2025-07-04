import { Anthropic } from '@anthropic-ai/sdk';
import { ArrangementRequest, ArrangementResponse, Section, SectionRecommendation } from '../types';

export async function getArrangementRecommendations(
    client: Anthropic,
    request: ArrangementRequest
): Promise<ArrangementResponse> {
    const { title, genre, style, customSections } = request;

    // If custom sections provided, parse them
    const userSections = customSections
        ? customSections.split(',').map(s => s.trim())
        : null;

    const prompt = `As a music arrangement expert, analyze and create a detailed arrangement for a song with these details:

Title: ${title}
${genre ? `Genre: ${genre}` : ''}
${style ? `Style: ${style}` : ''}
${userSections ? `Requested sections: ${userSections.join(', ')}` : ''}

Please:
1. ${userSections ? 'Use the requested sections and recommend appropriate bar counts for each' : 'Recommend appropriate sections and their bar counts'} based on typical ${genre || 'modern'} song structures
2. For each section, suggest which instruments should be active and their patterns
3. Consider typical ${genre || ''} arrangements and common practices

For each section, specify:
- Number of bars (based on genre conventions)
- Which instruments should play
- Whether instruments play throughout the section or have specific patterns

Format your response to include:
- Section name
- Duration in bars
- For each instrument, specify if it plays:
  - "all" for playing throughout the section
  - "none" for silence
  - A specific pattern description

Example format:
{
  "sections": [
    {
      "name": "Intro",
      "duration": 8,
      "patterns": {
        "drums": "all",
        "bass": "none",
        "guitar": "all"
      }
    }
  ]
}`;

    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    try {
        // Get the response content
        const message = response.content[0];
        if (!('text' in message)) {
            throw new Error('Unexpected response format from Anthropic');
        }
        const result = JSON.parse(message.text) as ArrangementResponse;
        return result;
    } catch (error) {
        console.error('Failed to parse Anthropic response:', error);
        throw new Error('Failed to get arrangement recommendations');
    }
}

export function generateBarPatterns(section: Section): void {
    // For each instrument in the section
    Object.keys(section.patterns).forEach(instrument => {
        // Initialize the bar pattern array
        section.barPatterns = section.barPatterns || {};
        section.barPatterns[instrument] = new Array(section.duration).fill(false);

        const pattern = section.patterns[instrument];
        // Simple pattern parsing - we can make this more sophisticated later
        if (pattern.toLowerCase().indexOf('all') !== -1 || pattern.toLowerCase().indexOf('whole') !== -1) {
            // Fill all bars
            section.barPatterns[instrument].fill(true);
        } else if (pattern.toLowerCase().indexOf('none') !== -1 || pattern.toLowerCase().indexOf('silent') !== -1) {
            // Leave all bars empty
            section.barPatterns[instrument].fill(false);
        } else {
            // Default to alternating pattern
            section.barPatterns[instrument] = section.barPatterns[instrument].map((_, index) => index % 2 === 0);
        }
    });
} 
