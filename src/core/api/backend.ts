const API_BASE_URL = process.env.API_BASE_URL || 'https://arreglo.vercel.app';

export class BackendError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'BackendError';
    }
}

async function backendFetch(path: string, token: string, body?: object, method: string = 'POST'): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
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

export async function getUsageBackend(token: string): Promise<{ creditBalance: number; plan: string }> {
    const response = await backendFetch('/v1/usage', token, undefined, 'GET');
    const data = await response.json();
    return {
        creditBalance: data?.user?.creditBalance ?? 0,
        plan: data?.user?.plan ?? 'free'
    };
}

export interface CreditPackInfo {
    id: string;
    credits: number;
    amountCents: number;
    name: string;
}

export async function getCreditPacksBackend(token: string): Promise<CreditPackInfo[]> {
    const response = await backendFetch('/v1/billing/packs', token, undefined, 'GET');
    const data = await response.json();
    return Array.isArray(data?.packs) ? data.packs : [];
}

export async function createCheckoutSessionBackend(pack: string, token: string): Promise<string> {
    const response = await backendFetch('/v1/billing/checkout-session', token, { pack });
    const data = await response.json();
    if (!data?.url) {
        throw new Error('Backend returned an unexpected response (missing checkout url).');
    }
    return data.url as string;
}
