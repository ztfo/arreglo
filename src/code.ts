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

async function createVisualArrangement(arrangement: any) {
    try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });

        const mainFrame = figma.createFrame();
        mainFrame.name = "Song Arrangement";
        mainFrame.layoutMode = "VERTICAL";
        mainFrame.counterAxisSizingMode = "AUTO";
        mainFrame.itemSpacing = 24;
        mainFrame.paddingTop = 32;
        mainFrame.paddingBottom = 32;
        mainFrame.paddingLeft = 32;
        mainFrame.paddingRight = 32;
        mainFrame.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];

        // Create patterns section
        const patternsFrame = figma.createFrame();
        patternsFrame.name = "Patterns";
        patternsFrame.layoutMode = "VERTICAL";
        patternsFrame.counterAxisSizingMode = "AUTO";
        patternsFrame.itemSpacing = 16;
        patternsFrame.fills = [];

        const patternsTitle = figma.createText();
        patternsTitle.characters = "Patterns";
        patternsTitle.fontSize = 20;
        patternsTitle.fontName = { family: "Inter", style: "Bold" };
        patternsFrame.appendChild(patternsTitle);

        for (const [instrument, pattern] of Object.entries(arrangement.patterns)) {
            const block = figma.createFrame();
            block.name = `${instrument} Pattern`;
            block.layoutMode = "VERTICAL";
            block.counterAxisSizingMode = "AUTO";
            block.fills = [{type: 'SOLID', color: {r: 0.95, g: 0.95, b: 0.95}}];
            block.cornerRadius = 8;
            block.paddingTop = 16;
            block.paddingBottom = 16;
            block.paddingLeft = 16;
            block.paddingRight = 16;

            const label = figma.createText();
            label.characters = instrument;
            label.fontSize = 16;
            label.fontName = { family: "Inter", style: "Medium" };

            const patternText = figma.createText();
            patternText.characters = pattern.toString();
            patternText.fontSize = 14;
            patternText.fontName = { family: "Inter", style: "Regular" };

            block.appendChild(label);
            block.appendChild(patternText);
            patternsFrame.appendChild(block);
        }

        mainFrame.appendChild(patternsFrame);

        // Create transitions section if there are transitions
        if (arrangement.transitions && arrangement.transitions.length > 0) {
            const transitionsFrame = figma.createFrame();
            transitionsFrame.name = "Transitions";
            transitionsFrame.layoutMode = "VERTICAL";
            transitionsFrame.counterAxisSizingMode = "AUTO";
            transitionsFrame.itemSpacing = 16;
            transitionsFrame.fills = [];

            const transitionsTitle = figma.createText();
            transitionsTitle.characters = "Transitions";
            transitionsTitle.fontSize = 20;
            transitionsTitle.fontName = { family: "Inter", style: "Bold" };
            transitionsFrame.appendChild(transitionsTitle);

            for (const transition of arrangement.transitions) {
                const block = figma.createFrame();
                block.name = "Transition";
                block.layoutMode = "VERTICAL";
                block.counterAxisSizingMode = "AUTO";
                block.fills = [{type: 'SOLID', color: {r: 0.95, g: 0.9, b: 1}}];
                block.cornerRadius = 8;
                block.paddingTop = 16;
                block.paddingBottom = 16;
                block.paddingLeft = 16;
                block.paddingRight = 16;

                const transitionText = figma.createText();
                transitionText.characters = transition;
                transitionText.fontSize = 14;
                transitionText.fontName = { family: "Inter", style: "Regular" };

                block.appendChild(transitionText);
                transitionsFrame.appendChild(block);
            }

            mainFrame.appendChild(transitionsFrame);
        }

        mainFrame.resize(800, mainFrame.height);
        mainFrame.x = figma.viewport.center.x - mainFrame.width / 2;
        mainFrame.y = figma.viewport.center.y - mainFrame.height / 2;

        figma.currentPage.appendChild(mainFrame);
        figma.viewport.scrollAndZoomIntoView([mainFrame]);
    } catch (error) {
        console.error('Error in createVisualArrangement:', error);
        throw error;
    }
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