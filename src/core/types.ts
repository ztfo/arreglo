export interface ApiConfig {
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    PREFERRED_API: 'anthropic' | 'openai';
}

export interface SongData {
    title: string;
    genre: string;
    length: number;
    tempo: number;
    instruments: string[];
}

export interface SongSection {
    name: string;
    startBar: number;
    duration: number;
    patterns: Record<string, string>;
}

export interface ArrangementData {
    title: string;
    sections: SongSection[];
    rawResponse: string;
}

export interface Message {
    type: string;
    config?: ApiConfig;
    songData?: SongData;
    message?: string;
    pluginMessage?: {
        type: string;
        config?: ApiConfig;
        songData?: SongData;
        message?: string;
    };
} 