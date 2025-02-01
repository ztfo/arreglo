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
    patterns: Array<{
        name: string;
        bars: number;
    }>;
    creativity: number;
    selectedSections: string[];
}

export interface SongSection {
    name: string;
    duration: number;
    instruments: Record<string, number[]>;
}

export interface ArrangementData {
    title: string;
    genre?: string;
    style?: string;
    sections: SongSection[];
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