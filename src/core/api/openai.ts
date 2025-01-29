export async function callOpenAI(apiKey: string, prompt: string) {
    const maxRetries = 3;
    let retryCount = 0;
    const baseDelay = 2000;
    
    console.log('Sending prompt to OpenAI:', prompt);
    
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
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('OpenAI Response:', data.choices[0].message.content);
            return data.choices[0].message.content;
        } catch (error: any) {
            console.error('OpenAI API Error:', error);
            if (retryCount === maxRetries - 1) throw error;
            retryCount++;
        }
    }
    throw new Error('Max retries reached');
} 