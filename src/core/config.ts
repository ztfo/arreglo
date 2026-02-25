import { ApiConfig } from './types';

export const defaultConfig: ApiConfig = {
    DATA_COLLECTION_CONSENT: true
};

export async function getConfig(): Promise<ApiConfig> {
    const config: ApiConfig = {
        DATA_COLLECTION_CONSENT: await figma.clientStorage.getAsync('DATA_COLLECTION_CONSENT') || false
    };
    return config;
}

export async function setConfig(config: ApiConfig): Promise<void> {
    await figma.clientStorage.setAsync('DATA_COLLECTION_CONSENT', config.DATA_COLLECTION_CONSENT);
}
