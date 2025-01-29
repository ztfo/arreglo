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
    barPatterns?: {  // Make barPatterns optional for backward compatibility
        [instrument: string]: boolean[];
    };
}

export interface ArrangementData {
    title: string;
    genre?: string;
    style?: string;
    sections: Section[];
    defaultSections?: string[]; // Default section suggestions
    rawResponse: string;
}

export interface Section {
    name: string;
    duration: number;
    patterns: {
        [instrument: string]: string;
    };
    instruments?: {
        [instrument: string]: {
            pattern: string;
            bars: number[];
        };
    };
    barPatterns?: {  // Make barPatterns optional initially, will be populated by generateBarPatterns
        [instrument: string]: boolean[];
    };
}

export interface SectionRecommendation {
    name: string;
    recommendedBars: number;
    description?: string;
}

export interface ArrangementRequest {
    title: string;
    genre?: string;
    style?: string;
    customSections?: string; // Comma-delimited section names
}

export interface ArrangementResponse {
    sections: SectionRecommendation[];
    explanation: string;
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