const API_BASE_URL = (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) || 'https://arreglo.vercel.app';

export class BackendError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'BackendError';
    }
}

async function backendFetch(path: string, token: string, body: object): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new BackendError(
            `Backend request failed: ${response.status} ${text}`,
            response.status
        );
    }

    return response;
}

export async function generateArrangementBackend(prompt: string, token: string): Promise<string> {
    const response = await backendFetch('/v1/arrangements/generate', token, { prompt });
    const data = await response.json();
    if (!data?.arrangement) {
        throw new Error('Backend returned an unexpected response (missing arrangement).');
    }
    return data.arrangement;
}

export async function analyzeImageBackend(base64Image: string, token: string): Promise<string[]> {
    const response = await backendFetch('/v1/vision/extract-tracks', token, { base64Image });
    const data = await response.json();
    if (!Array.isArray(data?.trackNames)) {
        throw new Error('Backend returned an unexpected response (missing trackNames).');
    }
    return data.trackNames as string[];
}
