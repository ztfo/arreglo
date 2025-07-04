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
    
    // Enhanced metadata for dance music analysis
    frequencyRange?: string[];        // Which frequency bands this pattern occupies
    energyContribution?: number;      // Energy level contribution (1-10)
    rhythmicComplexity?: string;      // simple, moderate, complex, polyrhythmic
    harmonicRole?: string;            // foundation, melody, harmony, texture, accent
    layeringPriority?: number;        // Order of introduction (1-10, lower = earlier)
    genreAffinities?: string[];       // Which genres this pattern works best with
    frequencyConflicts?: string[];    // Patterns that may conflict in frequency spectrum
    energyClassification?: string;    // foundation, driving, supporting, atmospheric, accent
}

export interface PatternRule {
    name: string;
    description: string;
    sectionPreference: string[];
    intensity: number;
    
    // Enhanced rule properties
    energyRange?: [number, number];   // Min/max energy contribution
    frequencyFocus?: string[];        // Which frequency ranges this rule affects
    genreSpecific?: string[];         // Genres where this rule applies
    conflictsWith?: string[];         // Pattern types that conflict with this rule
}

// New interfaces for enhanced pattern analysis
export interface PatternRelationship {
    pattern1: string;
    pattern2: string;
    relationshipType: 'complementary' | 'conflicting' | 'neutral' | 'layerable';
    frequencyConflict?: boolean;
    energyConflict?: boolean;
    rhythmicConflict?: boolean;
    confidence: number; // 0-1 confidence score
}

export interface GenreAnalysis {
    detectedGenre: string;
    confidence: number;
    supportingPatterns: string[];
    conflictingPatterns: string[];
    genreScore: {
        house: number;
        techno: number;
        trance: number;
        [key: string]: number;
    };
}

export interface EnergyArc {
    sections: {
        name: string;
        startEnergy: number;
        endEnergy: number;
        energyProfile: 'constant' | 'building' | 'dropping' | 'dynamic';
        peakMoment?: number; // Bar number of peak energy
    }[];
    totalEnergyFlow: 'linear' | 'wave' | 'plateau' | 'custom';
    genreTypical: boolean;
}

export interface Pattern {
    name: string;
    metadata?: PatternMetadata;
    rules?: PatternRule[];
} 