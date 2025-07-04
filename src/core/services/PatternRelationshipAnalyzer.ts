import { PatternMetadata, PatternRelationship } from '../types';
import { PatternAnalyzer } from './PatternAnalyzer';
import { FREQUENCY_RANGES, ENERGY_LEVELS } from '../constants/patternDefinitions';

export class PatternRelationshipAnalyzer {
    
    /**
     * Analyzes the relationship between two patterns
     */
    static analyzeRelationship(pattern1Name: string, pattern2Name: string): PatternRelationship {
        const metadata1 = PatternAnalyzer.analyzeName(pattern1Name);
        const metadata2 = PatternAnalyzer.analyzeName(pattern2Name);
        
        const frequencyConflict = this.hasFrequencyConflict(metadata1, metadata2);
        const energyConflict = this.hasEnergyConflict(metadata1, metadata2);
        const rhythmicConflict = this.hasRhythmicConflict(metadata1, metadata2);
        
        const relationshipType = this.determineRelationshipType(
            metadata1, metadata2, frequencyConflict, energyConflict, rhythmicConflict
        );
        
        const confidence = this.calculateConfidence(
            metadata1, metadata2, frequencyConflict, energyConflict, rhythmicConflict
        );
        
        return {
            pattern1: pattern1Name,
            pattern2: pattern2Name,
            relationshipType,
            frequencyConflict,
            energyConflict,
            rhythmicConflict,
            confidence
        };
    }
    
    /**
     * Analyzes relationships for a set of patterns
     */
    static analyzePatternSet(patterns: string[]): PatternRelationship[] {
        const relationships: PatternRelationship[] = [];
        
        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                relationships.push(this.analyzeRelationship(patterns[i], patterns[j]));
            }
        }
        
        return relationships;
    }
    
    /**
     * Finds the best complementary patterns for a given pattern
     */
    static findComplementaryPatterns(targetPattern: string, availablePatterns: string[]): string[] {
        const relationships = availablePatterns
            .filter(p => p !== targetPattern)
            .map(p => this.analyzeRelationship(targetPattern, p))
            .filter(r => r.relationshipType === 'complementary' || r.relationshipType === 'layerable')
            .sort((a, b) => b.confidence - a.confidence);
        
        return relationships.map(r => r.pattern2);
    }
    
    /**
     * Identifies patterns that conflict with the target pattern
     */
    static findConflictingPatterns(targetPattern: string, availablePatterns: string[]): string[] {
        const relationships = availablePatterns
            .filter(p => p !== targetPattern)
            .map(p => this.analyzeRelationship(targetPattern, p))
            .filter(r => r.relationshipType === 'conflicting')
            .sort((a, b) => b.confidence - a.confidence);
        
        return relationships.map(r => r.pattern2);
    }
    
    /**
     * Suggests optimal layering order for a set of patterns
     */
    static suggestLayeringOrder(patterns: string[]): string[] {
        const patternData = patterns.map(name => ({
            name,
            metadata: PatternAnalyzer.analyzeName(name)
        }));
        
        // Sort by layering priority (lower numbers = earlier introduction)
        return patternData
            .sort((a, b) => (a.metadata.layeringPriority || 5) - (b.metadata.layeringPriority || 5))
            .map(p => p.name);
    }
    
    // Private helper methods
    
    private static hasFrequencyConflict(meta1: PatternMetadata, meta2: PatternMetadata): boolean {
        const ranges1 = meta1.frequencyRange || [];
        const ranges2 = meta2.frequencyRange || [];
        
        // Check for overlap in frequency ranges
        const hasOverlap = ranges1.some(range => ranges2.includes(range));
        
        // Additional conflict logic for specific frequency conflicts
        const conflicts1 = meta1.frequencyConflicts || [];
        const conflicts2 = meta2.frequencyConflicts || [];
        
        const hasDirectConflict = conflicts1.includes(meta2.base) || conflicts2.includes(meta1.base);
        
        return hasOverlap && hasDirectConflict;
    }
    
    private static hasEnergyConflict(meta1: PatternMetadata, meta2: PatternMetadata): boolean {
        const energy1 = meta1.energyContribution || 5;
        const energy2 = meta2.energyContribution || 5;
        const classification1 = meta1.energyClassification || 'supporting';
        const classification2 = meta2.energyClassification || 'supporting';
        
        // Conflict if both are high energy foundation elements
        if (classification1 === 'foundation' && classification2 === 'foundation') {
            return Math.abs(energy1 - energy2) < 2; // Too similar energy levels
        }
        
        // Conflict if both are driving elements with similar energy
        if (classification1 === 'driving' && classification2 === 'driving') {
            return Math.abs(energy1 - energy2) < 1.5;
        }
        
        return false;
    }
    
    private static hasRhythmicConflict(meta1: PatternMetadata, meta2: PatternMetadata): boolean {
        const complexity1 = meta1.rhythmicComplexity || 'simple';
        const complexity2 = meta2.rhythmicComplexity || 'simple';
        const timing1 = meta1.timing || '';
        const timing2 = meta2.timing || '';
        
        // Conflict if both are polyrhythmic (too complex together)
        if (complexity1 === 'polyrhythmic' && complexity2 === 'polyrhythmic') {
            return true;
        }
        
        // Conflict if timing patterns clash
        if (timing1.includes('swing') && timing2.includes('straight')) {
            return true;
        }
        
        if (timing1.includes('polyrhythm') && timing2.includes('polyrhythm')) {
            return true;
        }
        
        return false;
    }
    
    private static determineRelationshipType(
        meta1: PatternMetadata, 
        meta2: PatternMetadata, 
        frequencyConflict: boolean, 
        energyConflict: boolean, 
        rhythmicConflict: boolean
    ): 'complementary' | 'conflicting' | 'neutral' | 'layerable' {
        
        // If any major conflicts exist, it's conflicting
        if (frequencyConflict || energyConflict || rhythmicConflict) {
            return 'conflicting';
        }
        
        const role1 = meta1.harmonicRole || '';
        const role2 = meta2.harmonicRole || '';
        const classification1 = meta1.energyClassification || '';
        const classification2 = meta2.energyClassification || '';
        
        // Complementary relationships
        if (
            (role1 === 'foundation' && role2 === 'melody') ||
            (role1 === 'melody' && role2 === 'harmony') ||
            (role1 === 'foundation' && role2 === 'accent') ||
            (classification1 === 'foundation' && classification2 === 'driving') ||
            (classification1 === 'supporting' && classification2 === 'atmospheric')
        ) {
            return 'complementary';
        }
        
        // Layerable relationships (can work together without major conflicts)
        if (
            (classification1 === 'atmospheric' && classification2 !== 'atmospheric') ||
            (role1 === 'texture' && role2 !== 'texture') ||
            (meta1.layeringPriority !== meta2.layeringPriority)
        ) {
            return 'layerable';
        }
        
        return 'neutral';
    }
    
    private static calculateConfidence(
        meta1: PatternMetadata, 
        meta2: PatternMetadata, 
        frequencyConflict: boolean, 
        energyConflict: boolean, 
        rhythmicConflict: boolean
    ): number {
        let confidence = 0.8; // Base confidence
        
        // Reduce confidence for conflicts
        if (frequencyConflict) confidence -= 0.3;
        if (energyConflict) confidence -= 0.2;
        if (rhythmicConflict) confidence -= 0.2;
        
        // Increase confidence for good complementary relationships
        const energy1 = meta1.energyContribution || 5;
        const energy2 = meta2.energyContribution || 5;
        const energyDifference = Math.abs(energy1 - energy2);
        
        if (energyDifference >= 2 && energyDifference <= 4) {
            confidence += 0.1; // Good energy contrast
        }
        
        // Increase confidence for different frequency ranges
        const ranges1 = meta1.frequencyRange || [];
        const ranges2 = meta2.frequencyRange || [];
        const hasFrequencyComplement = ranges1.length > 0 && ranges2.length > 0 && 
            !ranges1.some(range => ranges2.includes(range));
        
        if (hasFrequencyComplement) {
            confidence += 0.1;
        }
        
        // Ensure confidence is between 0 and 1
        return Math.max(0, Math.min(1, confidence));
    }
} 