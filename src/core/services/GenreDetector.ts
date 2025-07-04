import { GenreAnalysis, PatternMetadata } from '../types';
import { PatternAnalyzer } from './PatternAnalyzer';
import { GENRE_AFFINITIES } from '../constants/patternDefinitions';

export class GenreDetector {
    
    private static readonly GENRE_WEIGHTS = {
        essential: 3,    // Essential patterns have high weight
        preferred: 2,    // Preferred patterns have medium weight
        avoided: -2,     // Avoided patterns reduce score
        neutral: 0.5     // Patterns not mentioned get small weight
    };
    
    private static readonly CONFIDENCE_THRESHOLDS = {
        high: 0.7,       // >70% confidence = strong genre match
        medium: 0.5,     // 50-70% = moderate confidence
        low: 0.3         // 30-50% = low confidence, <30% = unclear
    };
    
    /**
     * Analyzes a set of patterns to detect the most likely genre
     */
    static detectGenre(patterns: string[]): GenreAnalysis {
        if (patterns.length === 0) {
            throw new Error('Cannot detect genre from empty pattern set');
        }
        
        const patternData = patterns.map(name => ({
            name,
            metadata: PatternAnalyzer.analyzeName(name)
        }));
        
        const genreScores = this.calculateGenreScores(patternData);
        const detectedGenre = this.findHighestScoringGenre(genreScores);
        const confidence = this.calculateConfidence(genreScores, detectedGenre);
        
        const supportingPatterns = this.findSupportingPatterns(patternData, detectedGenre);
        const conflictingPatterns = this.findConflictingPatterns(patternData, detectedGenre);
        
        return {
            detectedGenre,
            confidence,
            supportingPatterns,
            conflictingPatterns,
            genreScore: {
                house: genreScores.house || 0,
                techno: genreScores.techno || 0,
                trance: genreScores.trance || 0,
                ...genreScores
            }
        };
    }
    
    /**
     * Suggests genre-appropriate patterns to add to an existing set
     */
    static suggestGenrePatterns(currentPatterns: string[], targetGenre: string): string[] {
        const genreAffinity = (GENRE_AFFINITIES as any)[targetGenre.toLowerCase()];
        if (!genreAffinity) {
            return [];
        }
        
        const currentAnalysis = this.detectGenre(currentPatterns);
        const suggestions: string[] = [];
        
        // Add missing essential patterns
        const missingEssential = genreAffinity.essential.filter((pattern: string) => 
            !currentPatterns.some(cp => cp.toLowerCase().includes(pattern))
        );
        
        // Add missing preferred patterns
        const missingPreferred = genreAffinity.preferred.filter((pattern: string) => 
            !currentPatterns.some(cp => cp.toLowerCase().includes(pattern))
        );
        
        // Prioritize essential, then preferred
        suggestions.push(...missingEssential);
        suggestions.push(...missingPreferred.slice(0, 3)); // Limit suggestions
        
        return suggestions;
    }
    
    /**
     * Validates if a pattern set is appropriate for a target genre
     */
    static validateGenreMatch(patterns: string[], targetGenre: string): {
        isValid: boolean;
        confidence: number;
        issues: string[];
        suggestions: string[];
    } {
        const analysis = this.detectGenre(patterns);
        const isValid = analysis.detectedGenre.toLowerCase() === targetGenre.toLowerCase();
        const confidence = analysis.genreScore[targetGenre.toLowerCase()] || 0;
        
        const issues: string[] = [];
        const suggestions: string[] = [];
        
        if (!isValid) {
            issues.push(`Patterns suggest ${analysis.detectedGenre} rather than ${targetGenre}`);
        }
        
        if (analysis.conflictingPatterns.length > 0) {
            issues.push(`Conflicting patterns detected: ${analysis.conflictingPatterns.join(', ')}`);
            suggestions.push('Consider removing conflicting patterns');
        }
        
        if (confidence < this.CONFIDENCE_THRESHOLDS.medium) {
            issues.push('Low confidence in genre match');
            const genreSuggestions = this.suggestGenrePatterns(patterns, targetGenre);
            if (genreSuggestions.length > 0) {
                suggestions.push(`Add ${targetGenre}-specific patterns: ${genreSuggestions.slice(0, 3).join(', ')}`);
            }
        }
        
        return {
            isValid,
            confidence,
            issues,
            suggestions
        };
    }
    
    // Private helper methods
    
    private static calculateGenreScores(patternData: Array<{name: string, metadata: PatternMetadata}>): {[key: string]: number} {
        const scores: {[key: string]: number} = {};
        
        // Initialize scores for known genres
        Object.keys(GENRE_AFFINITIES).forEach(genre => {
            scores[genre] = 0;
        });
        
        patternData.forEach(({name, metadata}) => {
            const base = metadata.base;
            const timing = metadata.timing || '';
            const role = metadata.role || '';
            const genreAffinities = metadata.genreAffinities || [];
            
            // Score based on genre affinities in metadata
            genreAffinities.forEach(genre => {
                scores[genre] = (scores[genre] || 0) + this.GENRE_WEIGHTS.preferred;
            });
            
            // Score based on specific genre pattern matching
            Object.entries(GENRE_AFFINITIES).forEach(([genre, patterns]) => {
                let patternScore = 0;
                
                // Check essential patterns
                if (this.matchesPatternList(base, timing, role, patterns.essential)) {
                    patternScore += this.GENRE_WEIGHTS.essential;
                }
                
                // Check preferred patterns  
                if (this.matchesPatternList(base, timing, role, patterns.preferred)) {
                    patternScore += this.GENRE_WEIGHTS.preferred;
                }
                
                // Check avoided patterns
                if (this.matchesPatternList(base, timing, role, patterns.avoided)) {
                    patternScore += this.GENRE_WEIGHTS.avoided;
                }
                
                scores[genre] = (scores[genre] || 0) + patternScore;
            });
        });
        
        // Normalize scores to 0-1 range
        const maxScore = Math.max(...Object.values(scores));
        const minScore = Math.min(...Object.values(scores));
        const range = maxScore - minScore;
        
        if (range > 0) {
            Object.keys(scores).forEach(genre => {
                scores[genre] = Math.max(0, (scores[genre] - minScore) / range);
            });
        }
        
        return scores;
    }
    
    private static matchesPatternList(base: string, timing: string, role: string, patterns: string[]): boolean {
        return patterns.some(pattern => 
            base.includes(pattern) || 
            timing.includes(pattern) || 
            role.includes(pattern) ||
            pattern.includes(base)
        );
    }
    
    private static findHighestScoringGenre(scores: {[key: string]: number}): string {
        return Object.entries(scores)
            .reduce((highest, [genre, score]) => 
                score > highest.score ? {genre, score} : highest, 
                {genre: 'unknown', score: -1}
            ).genre;
    }
    
    private static calculateConfidence(scores: {[key: string]: number}, detectedGenre: string): number {
        const genreScore = scores[detectedGenre] || 0;
        const otherScores = Object.values(scores).filter((_, index) => 
            Object.keys(scores)[index] !== detectedGenre
        );
        
        if (otherScores.length === 0) return 0.5;
        
        const averageOtherScore = otherScores.reduce((sum, score) => sum + score, 0) / otherScores.length;
        const maxOtherScore = Math.max(...otherScores);
        
        // Confidence based on how much higher the detected genre scores vs others
        const confidenceVsAverage = Math.min(1, (genreScore - averageOtherScore) / 0.5);
        const confidenceVsMax = Math.min(1, (genreScore - maxOtherScore + 0.3) / 0.5);
        
        return Math.max(0, Math.min(1, (confidenceVsAverage + confidenceVsMax) / 2));
    }
    
    private static findSupportingPatterns(
        patternData: Array<{name: string, metadata: PatternMetadata}>, 
        genre: string
    ): string[] {
        const genreAffinity = (GENRE_AFFINITIES as any)[genre];
        if (!genreAffinity) return [];
        
        return patternData
            .filter(({metadata}) => {
                const base = metadata.base;
                const timing = metadata.timing || '';
                const role = metadata.role || '';
                
                return this.matchesPatternList(base, timing, role, [...genreAffinity.essential, ...genreAffinity.preferred]);
            })
            .map(({name}) => name);
    }
    
    private static findConflictingPatterns(
        patternData: Array<{name: string, metadata: PatternMetadata}>, 
        genre: string
    ): string[] {
        const genreAffinity = (GENRE_AFFINITIES as any)[genre];
        if (!genreAffinity) return [];
        
        return patternData
            .filter(({metadata}) => {
                const base = metadata.base;
                const timing = metadata.timing || '';
                const role = metadata.role || '';
                
                return this.matchesPatternList(base, timing, role, genreAffinity.avoided);
            })
            .map(({name}) => name);
    }
} 