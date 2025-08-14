// Thin backend API client (disabled until backend is live).
// Keep secrets server-side. This client sends authenticated requests to your API.

import { SongData } from '../types';

const DEFAULT_API_BASE_URL = 'https://your-backend.example.com'; // Not secret; replace when backend is live

function getApiBaseUrl(): string {
    // In Figma plugin we don't have process.env; swap this when wiring to backend
    return DEFAULT_API_BASE_URL;
}

export async function generateArrangementBackend(songData: SongData, accessToken?: string): Promise<string> {
    const response = await fetch(`${getApiBaseUrl()}/v1/arrangements/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ songData })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Backend generate failed: ${response.status} ${response.statusText} ${text}`);
    }

    const data = await response.json();
    return data.arrangement;
}

export async function analyzeImageBackend(base64Image: string, accessToken?: string): Promise<string[]> {
    const response = await fetch(`${getApiBaseUrl()}/v1/vision/extract-tracks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ base64Image })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Backend vision failed: ${response.status} ${response.statusText} ${text}`);
    }

    const data = await response.json();
    return data.trackNames as string[];
}

