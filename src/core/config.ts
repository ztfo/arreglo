import { ApiConfig } from './types';

export const defaultConfig: ApiConfig = {
    OPENAI_API_KEY: '',
    DATA_COLLECTION_CONSENT: true
};

export async function getConfig(): Promise<ApiConfig> {
    const config: ApiConfig = {
        OPENAI_API_KEY: await figma.clientStorage.getAsync('OPENAI_API_KEY') || '',
        DATA_COLLECTION_CONSENT: await figma.clientStorage.getAsync('DATA_COLLECTION_CONSENT') || false
    };
    return config;
}

export async function setConfig(config: ApiConfig): Promise<void> {
    await figma.clientStorage.setAsync('OPENAI_API_KEY', config.OPENAI_API_KEY);
    await figma.clientStorage.setAsync('DATA_COLLECTION_CONSENT', config.DATA_COLLECTION_CONSENT);
}

export async function validateConfig(config: ApiConfig): Promise<boolean> {
    return !!config.OPENAI_API_KEY;
} 