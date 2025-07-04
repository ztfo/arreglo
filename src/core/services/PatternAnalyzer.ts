import { PatternMetadata, PatternRule } from '../types';
import { 
    PATTERN_COMPONENTS, 
    SECTION_RULES, 
    FREQUENCY_RANGES, 
    ENERGY_LEVELS, 
    RHYTHMIC_COMPLEXITY, 
    GENRE_AFFINITIES 
} from '../constants/patternDefinitions';

export class PatternAnalyzer {
    static analyzeName(patternName: string): PatternMetadata {
        const parts = patternName.toLowerCase().split(/[-\s]+/).map(p => p.trim());
        const metadata: PatternMetadata = {
            base: this.findComponent(parts, PATTERN_COMPONENTS.bases) || parts[0]
        };

        // Analyze basic pattern components
        parts.forEach(part => {
            if (PATTERN_COMPONENTS.types.includes(part)) {
                metadata.type = part;
            } else if (PATTERN_COMPONENTS.complexities.includes(part)) {
                metadata.complexity = part;
            } else if (PATTERN_COMPONENTS.functions.includes(part)) {
                metadata.function = part;
            } else if (PATTERN_COMPONENTS.timing.includes(part)) {
                metadata.timing = part;
            } else if (PATTERN_COMPONENTS.roles.includes(part)) {
                metadata.role = part;
            }
        });

        // Populate enhanced metadata fields
        metadata.frequencyRange = this.determineFrequencyRange(metadata.base);
        metadata.energyContribution = this.calculateEnergyContribution(metadata);
        metadata.rhythmicComplexity = this.determineRhythmicComplexity(metadata);
        metadata.harmonicRole = this.determineHarmonicRole(metadata);
        metadata.layeringPriority = this.calculateLayeringPriority(metadata);
        metadata.genreAffinities = this.determineGenreAffinities(metadata);
        metadata.frequencyConflicts = this.identifyFrequencyConflicts(metadata);
        metadata.energyClassification = this.classifyEnergyLevel(metadata.base);

        return metadata;
    }

    static getPatternRules(metadata: PatternMetadata): PatternRule[] {
        const rules: PatternRule[] = [];

        // Base instrument rules
        this.addBaseRules(metadata, rules);
        
        // Timing rules
        this.addTimingRules(metadata, rules);
        
        // Function rules
        this.addFunctionRules(metadata, rules);
        
        // Complexity rules
        this.addComplexityRules(metadata, rules);

        return rules;
    }

    private static addBaseRules(metadata: PatternMetadata, rules: PatternRule[]): void {
        const baseRules: Record<string, () => PatternRule> = {
            'kick': () => ({
                name: 'foundation',
                description: 'Primary rhythm foundation',
                sectionPreference: ['Verse', 'Chorus', 'Drop'],
                intensity: 4
            }),
            'bass': () => ({
                name: 'low-end',
                description: 'Low frequency foundation',
                sectionPreference: ['Verse', 'Chorus', 'Drop'],
                intensity: 3
            }),
            // Add more base rules...
        };

        if (metadata.base in baseRules) {
            rules.push(baseRules[metadata.base]());
        }
    }

    private static addTimingRules(metadata: PatternMetadata, rules: PatternRule[]): void {
        if (metadata.timing === '4x') {
            rules.push({
                name: 'four-on-floor',
                description: 'Steady quarter note pattern',
                sectionPreference: ['Verse', 'Chorus', 'Drop'],
                intensity: 4
            });
        }
        // Add more timing rules...
    }

    private static addFunctionRules(metadata: PatternMetadata, rules: PatternRule[]): void {
        if (metadata.function === 'buildup') {
            rules.push({
                name: 'intensity-builder',
                description: 'Gradually increasing intensity',
                sectionPreference: ['Build', 'Pre-Chorus', 'Bridge'],
                intensity: 4
            });
        } else if (metadata.function === 'breakdown') {
            rules.push({
                name: 'energy-release',
                description: 'Reducing energy for contrast',
                sectionPreference: ['Bridge', 'Breakdown', 'Outro'],
                intensity: 2
            });
        }
    }

    private static addComplexityRules(metadata: PatternMetadata, rules: PatternRule[]): void {
        const complexityRules: Record<string, PatternRule> = {
            'simple': {
                name: 'basic-pattern',
                description: 'Straightforward, foundational pattern',
                sectionPreference: ['Intro', 'Verse', 'Outro'],
                intensity: 2
            },
            'complex': {
                name: 'advanced-pattern',
                description: 'Intricate, detailed pattern',
                sectionPreference: ['Chorus', 'Drop', 'Bridge'],
                intensity: 4
            }
        };

        if (metadata.complexity && metadata.complexity in complexityRules) {
            rules.push(complexityRules[metadata.complexity]);
        }
    }

    private static findComponent(parts: string[], components: string[]): string | undefined {
        return parts.find(part => components.includes(part));
    }

    // Enhanced metadata calculation methods
    private static determineFrequencyRange(base: string): string[] {
        const ranges: string[] = [];
        
        // Check each frequency range for matches
        for (const [range, patterns] of Object.entries(FREQUENCY_RANGES)) {
            if (patterns.includes(base)) {
                ranges.push(range);
            }
        }
        
        return ranges.length > 0 ? ranges : ['mid']; // Default to mid if no match
    }

    private static calculateEnergyContribution(metadata: PatternMetadata): number {
        let energy = 5; // Default energy level
        
        // Base energy from pattern type
        if (metadata.base === 'kick') energy = 8;
        else if (metadata.base === 'bass' || metadata.base === 'bassline') energy = 7;
        else if (metadata.base === 'snare' || metadata.base === 'clap') energy = 6;
        else if (metadata.base === 'hat' || metadata.base === 'hihat') energy = 5;
        else if (metadata.base === 'synth' || metadata.base === 'lead') energy = 6;
        else if (metadata.base === 'pad' || metadata.base === 'chord') energy = 4;
        else if (metadata.base === 'fx' || metadata.base === 'ambient') energy = 2;
        
        // Adjust for timing
        if (metadata.timing === '4x') energy += 1;
        else if (metadata.timing === 'offbeat') energy += 0.5;
        
        // Adjust for complexity
        if (metadata.complexity === 'complex') energy += 1;
        else if (metadata.complexity === 'simple') energy -= 1;
        
        // Adjust for function
        if (metadata.function === 'buildup') energy += 1;
        else if (metadata.function === 'breakdown') energy -= 2;
        
        return Math.max(1, Math.min(10, Math.round(energy)));
    }

    private static determineRhythmicComplexity(metadata: PatternMetadata): string {
        const timing = metadata.timing || '';
        const complexity = metadata.complexity || '';
        
        // Check for polyrhythmic patterns
        if (timing.includes('polyrhythm') || timing.includes('counter') || complexity === 'intricate') {
            return 'polyrhythmic';
        }
        
        // Check for complex patterns
        if (timing.includes('triplet') || timing.includes('16th') || timing.includes('dotted') || complexity === 'complex') {
            return 'complex';
        }
        
        // Check for moderate patterns
        if (timing.includes('offbeat') || timing.includes('swing') || timing.includes('syncopated') || timing.includes('groove')) {
            return 'moderate';
        }
        
        // Default to simple
        return 'simple';
    }

    private static determineHarmonicRole(metadata: PatternMetadata): string {
        const base = metadata.base;
        const role = metadata.role || '';
        
        if (base === 'kick' || base === 'bass' || base === 'bassline') {
            return 'foundation';
        } else if (base === 'lead' || base === 'synth' || role === 'lead') {
            return 'melody';
        } else if (base === 'chord' || base === 'pad' || role === 'harmony') {
            return 'harmony';
        } else if (base === 'fx' || base === 'ambient' || role === 'atmosphere') {
            return 'texture';
        } else if (base === 'clap' || base === 'snare' || role === 'accent') {
            return 'accent';
        }
        
        return 'texture'; // Default
    }

    private static calculateLayeringPriority(metadata: PatternMetadata): number {
        const base = metadata.base;
        
        // Foundation elements come first
        if (base === 'kick') return 1;
        if (base === 'bass' || base === 'bassline') return 2;
        if (base === 'hat' || base === 'hihat') return 3;
        if (base === 'snare' || base === 'clap') return 4;
        if (base === 'synth' || base === 'chord') return 5;
        if (base === 'lead') return 6;
        if (base === 'pad') return 7;
        if (base === 'fx') return 8;
        if (base === 'vocal' || base === 'vox') return 9;
        
        return 5; // Default middle priority
    }

    private static determineGenreAffinities(metadata: PatternMetadata): string[] {
        const affinities: string[] = [];
        const base = metadata.base;
        const timing = metadata.timing || '';
        const role = metadata.role || '';
        
        // Check genre affinities based on pattern characteristics
        for (const [genre, patterns] of Object.entries(GENRE_AFFINITIES)) {
            const isEssential = patterns.essential.some(p => 
                base.includes(p) || timing.includes(p) || role.includes(p)
            );
            const isPreferred = patterns.preferred.some(p => 
                base.includes(p) || timing.includes(p) || role.includes(p)
            );
            const isAvoided = patterns.avoided.some(p => 
                base.includes(p) || timing.includes(p) || role.includes(p)
            );
            
            if (isEssential || isPreferred) {
                affinities.push(genre);
            } else if (isAvoided) {
                // Skip genres that avoid this pattern
                continue;
            }
        }
        
        return affinities.length > 0 ? affinities : ['house', 'techno', 'trance']; // Default to all
    }

    private static identifyFrequencyConflicts(metadata: PatternMetadata): string[] {
        const conflicts: string[] = [];
        const frequencyRanges = metadata.frequencyRange || [];
        
        // Find patterns that occupy similar frequency ranges
        for (const [range, patterns] of Object.entries(FREQUENCY_RANGES)) {
            if (frequencyRanges.includes(range)) {
                // Add patterns from same frequency range as potential conflicts
                conflicts.push(...patterns.filter(p => p !== metadata.base));
            }
        }
        
        return [...new Set(conflicts)]; // Remove duplicates
    }

    private static classifyEnergyLevel(base: string): string {
        // Find energy classification for this pattern
        for (const [classification, patterns] of Object.entries(ENERGY_LEVELS)) {
            if (patterns.includes(base)) {
                return classification;
            }
        }
        
        return 'supporting'; // Default classification
    }
} 