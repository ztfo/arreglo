import { PatternMetadata, PatternRule } from '../types';
import { PATTERN_COMPONENTS, SECTION_RULES } from '../constants/patternDefinitions';

export class PatternAnalyzer {
    static analyzeName(patternName: string): PatternMetadata {
        const parts = patternName.toLowerCase().split(/[-\s]+/).map(p => p.trim());
        const metadata: PatternMetadata = {
            base: this.findComponent(parts, PATTERN_COMPONENTS.bases) || parts[0]
        };

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
} 