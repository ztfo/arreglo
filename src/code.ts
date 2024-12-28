import { getConfig, setConfig, ApiConfig } from './config';

// Show UI for plugin mode
figma.showUI(__html__, { width: 400, height: 600 });

// Function to validate API configuration
async function validateConfig(config: ApiConfig): Promise<boolean> {
    return config.OPENAI_API_KEY !== '' || config.ANTHROPIC_API_KEY !== '';
}

// Function to make OpenAI API calls
async function callOpenAI(apiKey: string, prompt: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
        
        // Validate that we have at least one API key
        if (!await validateConfig(config)) {
            figma.ui.postMessage({ 
                type: 'error', 
                message: 'Please configure at least one API key in settings first!' 
            });
            return;
        }

        try {
            const songData = msg.songData;
            const prompt = `Generate a detailed song arrangement for a ${songData.genre} song that is ${songData.length} seconds long with a tempo of ${songData.tempo} BPM. Include patterns for these instruments: ${songData.instruments.join(', ')}`;
            
            let response;
            if (config.PREFERRED_API === 'openai' && config.OPENAI_API_KEY) {
                response = await callOpenAI(config.OPENAI_API_KEY, prompt);
            } else if (config.PREFERRED_API === 'anthropic' && config.ANTHROPIC_API_KEY) {
                response = await callAnthropic(config.ANTHROPIC_API_KEY, prompt);
            } else {
                throw new Error('No valid API configuration found');
            }

            // TODO: Parse the response and create the visual arrangement
            console.log('AI Response:', response);
            
        } catch (error: any) {
            figma.ui.postMessage({ 
                type: 'error', 
                message: 'Error generating arrangement: ' + error.message 
            });
        }
    }
};