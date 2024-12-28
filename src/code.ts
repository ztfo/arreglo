import { getConfig, setConfig, ApiConfig } from './config';

// Show UI for plugin mode
figma.showUI(__html__, { width: 400, height: 600 });

// Function to validate API configuration
async function validateConfig(config: ApiConfig): Promise<boolean> {
    return config.OPENAI_API_KEY !== '' || config.ANTHROPIC_API_KEY !== '';
}

// Function to make OpenAI API calls
async function callOpenAI(apiKey: string, prompt: string) {
    const maxRetries = 3;
    let retryCount = 0;
    const baseDelay = 2000; // 2 seconds base delay
    
    while (retryCount < maxRetries) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, retryCount);
                console.log(`Rate limited. Retrying after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retryCount++;
                continue;
            }

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('API call error:', error);
            if (retryCount === maxRetries - 1) throw error;
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, retryCount)));
        }
    }
    throw new Error('Max retries reached');
}

// Function to make Anthropic API calls
async function callAnthropic(apiKey: string, prompt: string) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-2.1',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

function parseArrangement(response: string) {
    console.log('Parsing response:', response); // Debug log
    const sections = response.split('\n').filter(line => line.trim() !== '');
    const patterns: Record<string, string> = {};
    const transitions: string[] = [];

    sections.forEach(section => {
        const line = section.trim();
        if (line.toLowerCase().includes('transition:')) {
            transitions.push(line);
        } else {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const instrument = line.substring(0, colonIndex).trim();
                const pattern = line.substring(colonIndex + 1).trim();
                if (instrument && pattern) {
                    patterns[instrument] = pattern;
                }
            }
        }
    });

    console.log('Parsed patterns:', patterns); // Debug log
    console.log('Parsed transitions:', transitions); // Debug log
    
    if (Object.keys(patterns).length === 0) {
        throw new Error('No valid patterns found in the response');
    }

    return { patterns, transitions };
}

async function createVisualArrangement(arrangement: { patterns: Record<string, string>, transitions: string[] }) {
    const mainFrame = figma.createFrame();
    mainFrame.name = "Song Arrangement";
    mainFrame.resize(800, 600);
    mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

    let yOffset = 40;
    const xPadding = 40;

    // Create pattern blocks
    for (const [instrument, pattern] of Object.entries(arrangement.patterns)) {
        const block = figma.createFrame();
        block.name = instrument;
        block.resize(720, 80);
        block.x = xPadding;
        block.y = yOffset;
        block.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 1 } }];
        block.cornerRadius = 8;

        const label = figma.createText();
        label.characters = instrument;
        label.x = 16;
        label.y = 16;
        label.fontSize = 16;

        const patternText = figma.createText();
        patternText.characters = pattern;
        patternText.x = 16;
        patternText.y = 40;
        patternText.fontSize = 14;

        block.appendChild(label);
        block.appendChild(patternText);
        mainFrame.appendChild(block);

        yOffset += 100;
    }

    // Add transitions if any
    if (arrangement.transitions.length > 0) {
        const transitionBlock = figma.createFrame();
        transitionBlock.name = "Transitions";
        transitionBlock.resize(720, 100);
        transitionBlock.x = xPadding;
        transitionBlock.y = yOffset;
        transitionBlock.fills = [{ type: 'SOLID', color: { r: 1, g: 0.95, b: 0.95 } }];
        transitionBlock.cornerRadius = 8;

        const label = figma.createText();
        label.characters = "Transitions";
        label.x = 16;
        label.y = 16;
        label.fontSize = 16;

        const transText = figma.createText();
        transText.characters = arrangement.transitions.join("\n");
        transText.x = 16;
        transText.y = 40;
        transText.fontSize = 14;

        transitionBlock.appendChild(label);
        transitionBlock.appendChild(transText);
        mainFrame.appendChild(transitionBlock);
    }

    // Adjust main frame height
    mainFrame.resize(800, yOffset + 140);

    // Center in viewport
    mainFrame.x = figma.viewport.center.x - mainFrame.width / 2;
    mainFrame.y = figma.viewport.center.y - mainFrame.height / 2;

    figma.currentPage.appendChild(mainFrame);
    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    
    return mainFrame;
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'load-settings') {
        const config = await getConfig();
        figma.ui.postMessage({ type: 'settings-loaded', config });
    }
    else if (msg.type === 'save-settings') {
        await setConfig(msg.config);
        figma.ui.postMessage({ type: 'settings-saved' });
    }
    else if (msg.type === 'generate-arrangement') {
        const config = await getConfig();
        
        try {
            if (!await validateConfig(config)) {
                throw new Error('Please configure at least one API key in settings first!');
            }

            const songData = msg.songData;
            const prompt = `Generate a detailed song arrangement for a ${songData.genre} song that is ${songData.length} seconds long with a tempo of ${songData.tempo} BPM. Include patterns for these instruments: ${songData.instruments.join(', ')}`;
            
            let response;
            try {
                if (config.PREFERRED_API === 'openai' && config.OPENAI_API_KEY) {
                    response = await callOpenAI(config.OPENAI_API_KEY, prompt);
                } else if (config.PREFERRED_API === 'anthropic' && config.ANTHROPIC_API_KEY) {
                    response = await callAnthropic(config.ANTHROPIC_API_KEY, prompt);
                } else {
                    throw new Error('No valid API configuration found');
                }
            } catch (apiError: any) {
                throw new Error(`API Error: ${apiError.message}`);
            }

            const arrangement = parseArrangement(response);
            await createVisualArrangement(arrangement);
            figma.ui.postMessage({ type: 'success', message: 'Arrangement created!' });
            
        } catch (error: any) {
            figma.ui.postMessage({ 
                type: 'error', 
                message: 'Error generating arrangement: ' + error.message 
            });
        }
    }
};