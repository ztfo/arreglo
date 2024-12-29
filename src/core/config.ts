export interface ApiConfig {
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    PREFERRED_API: 'anthropic' | 'openai';
}

export async function getConfig(): Promise<ApiConfig> {
    const config = {
        OPENAI_API_KEY: await figma.clientStorage.getAsync('OPENAI_API_KEY') || '',
        ANTHROPIC_API_KEY: await figma.clientStorage.getAsync('ANTHROPIC_API_KEY') || '',
        PREFERRED_API: (await figma.clientStorage.getAsync('PREFERRED_API') || 'openai') as 'openai' | 'anthropic'
    };
    return config;
}

export async function setConfig(config: ApiConfig): Promise<void> {
    await figma.clientStorage.setAsync('OPENAI_API_KEY', config.OPENAI_API_KEY);
    await figma.clientStorage.setAsync('ANTHROPIC_API_KEY', config.ANTHROPIC_API_KEY);
    await figma.clientStorage.setAsync('PREFERRED_API', config.PREFERRED_API);
} 