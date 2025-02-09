export interface ApiConfig {
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    PREFERRED_API: 'anthropic' | 'openai';
    DATA_COLLECTION_CONSENT: boolean;
}

export interface SongData {
    title: string;
    genre: string;
    length: number;
    tempo: number;
    instruments: string[];
    patterns: Pattern[];
    creativity: number;
    selectedSections: string[];
    isTest?: boolean;
}

export interface SongSection {
    name: string;
    duration: number;
    instruments: {
        [instrument: string]: number[];
    };
    metadata?: {
        [instrument: string]: PatternMetadata;
    };
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

export interface ArrangementAnalytics {
    timestamp: string;
    requestData: {
        songData: SongData;
        prompt?: string;  // The actual prompt sent to AI
    };
    responseData: {
        arrangementData: ArrangementData;
        rawResponse: string;
    };
    metadata: {
        apiUsed: 'openai' | 'anthropic';
        processingTime: number;
        success: boolean;
        error?: string;
    };
    userConsent: boolean;
}

export interface PatternMetadata {
    base: string;
    type?: string;
    complexity?: string;
    function?: string;
    timing?: string;
    role?: string;
}

export interface PatternRule {
    name: string;
    description: string;
    sectionPreference: string[];
    intensity: number;
}

export interface Pattern {
    name: string;
    metadata?: PatternMetadata;
    rules?: PatternRule[];
} 