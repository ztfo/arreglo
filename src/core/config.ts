export interface ApiConfig {
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    PREFERRED_API: 'anthropic' | 'openai';
}

export async function getConfig(): Promise<ApiConfig> {
    const keys = await figma.clientStorage.getAsync('api_keys');
    return keys as ApiConfig || {
        ANTHROPIC_API_KEY: '',
        OPENAI_API_KEY: '',
        PREFERRED_API: 'openai'
    };
}

export async function setConfig(config: ApiConfig): Promise<void> {
    await figma.clientStorage.setAsync('api_keys', config);
} 