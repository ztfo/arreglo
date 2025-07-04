import { EnergyArc, GenreAnalysis } from '../types';
import { SECTION_RULES } from '../constants/patternDefinitions';
import { GenreDetector } from './GenreDetector';

export class EnergyArcDesigner {
    
    private static readonly ENERGY_PROFILES = {
        house: {
            intro: [15, 20],        // Gentle start
            verse: [35, 45],        // Mid-level groove
            chorus: [70, 80],       // High energy but controlled
            buildup: [45, 75],      // Gradual rise
            drop: [85, 95],         // Peak energy
            breakdown: [25, 35],    // Significant drop for contrast
            outro: [15, 25]         // Gentle fade
        },
        techno: {
            intro: [20, 30],        // Slightly more intense start
            verse: [40, 50],        // Driving foundation
            chorus: [75, 85],       // High driving energy
            buildup: [50, 80],      // Intense buildup
            drop: [90, 100],        // Maximum intensity
            breakdown: [20, 30],    // Minimal breakdown
            outro: [10, 20]         // Abrupt ending
        },
        trance: {
            intro: [10, 15],        // Atmospheric start
            verse: [30, 40],        // Emotional foundation
            chorus: [80, 90],       // Euphoric peak
            buildup: [40, 85],      // Epic buildup
            drop: [85, 98],         // Massive release
            breakdown: [15, 25],    // Emotional breakdown
            outro: [10, 20]         // Atmospheric fade
        }
    };
    
    private static readonly FLOW_PATTERNS = {
        linear: 'steady progression from low to high energy',
        wave: 'multiple peaks and valleys creating dynamic flow',
        plateau: 'sustained high energy with brief breaks',
        mountain: 'single major peak with gradual rise and fall'
    };
    
    /**
     * Designs an energy arc for a complete arrangement
     */
    static designEnergyArc(
        sections: string[], 
        totalLength: number, 
        patterns: string[], 
        targetGenre?: string
    ): EnergyArc {
        // Detect genre if not provided
        const genreAnalysis = targetGenre ? 
            { detectedGenre: targetGenre, confidence: 1 } : 
            GenreDetector.detectGenre(patterns);
        
        const genre = genreAnalysis.detectedGenre.toLowerCase();
        const energyProfile = this.getEnergyProfile(genre);
        
        // Design section energy levels
        const sectionArcs = this.designSectionArcs(sections, totalLength, energyProfile);
        
        // Determine overall flow pattern
        const totalEnergyFlow = this.determineTotalEnergyFlow(sectionArcs, genre);
        
        // Validate genre appropriateness
        const genreTypical = this.validateGenreTypical(sectionArcs, genre);
        
        return {
            sections: sectionArcs,
            totalEnergyFlow,
            genreTypical
        };
    }
    
    /**
     * Suggests optimal section order based on energy flow
     */
    static suggestSectionOrder(
        availableSections: string[], 
        targetLength: number, 
        genre: string
    ): string[] {
        const energyProfile = this.getEnergyProfile(genre);
        const sectionPriorities = this.getSectionPriorities(genre);
        
        // Start with essential sections
        const orderedSections: string[] = [];
        
        // Always start with intro if available
        if (availableSections.includes('Intro')) {
            orderedSections.push('Intro');
        }
        
        // Add main progression based on genre
        const remainingSections = availableSections.filter(s => s !== 'Intro' && s !== 'Outro');
        const sortedSections = remainingSections.sort((a, b) => {
            const priorityA = sectionPriorities[a.toLowerCase()] || 5;
            const priorityB = sectionPriorities[b.toLowerCase()] || 5;
            return priorityA - priorityB;
        });
        
        orderedSections.push(...sortedSections);
        
        // Always end with outro if available
        if (availableSections.includes('Outro')) {
            orderedSections.push('Outro');
        }
        
        return orderedSections;
    }
    
    /**
     * Calculates energy transitions between sections
     */
    static calculateEnergyTransitions(energyArc: EnergyArc): Array<{
        fromSection: string;
        toSection: string;
        energyChange: number;
        transitionType: 'smooth' | 'dramatic' | 'buildup' | 'drop';
        recommended: boolean;
    }> {
        const transitions = [];
        
        for (let i = 0; i < energyArc.sections.length - 1; i++) {
            const current = energyArc.sections[i];
            const next = energyArc.sections[i + 1];
            
            const energyChange = next.startEnergy - current.endEnergy;
            const transitionType = this.getTransitionType(energyChange);
            const recommended = this.isRecommendedTransition(current.name, next.name, energyChange);
            
            transitions.push({
                fromSection: current.name,
                toSection: next.name,
                energyChange,
                transitionType,
                recommended
            });
        }
        
        return transitions;
    }
    
    /**
     * Validates if an energy arc follows genre conventions
     */
    static validateEnergyArc(energyArc: EnergyArc, genre: string): {
        isValid: boolean;
        issues: string[];
        suggestions: string[];
        score: number;
    } {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;
        
        const energyProfile = this.getEnergyProfile(genre);
        
        // Check if sections follow genre energy conventions
        energyArc.sections.forEach(section => {
            const sectionName = section.name.toLowerCase().replace(/\s+/g, '').replace(/\d+/g, '');
            const expectedRange = energyProfile[sectionName as keyof typeof energyProfile];
            
            if (expectedRange) {
                if (section.startEnergy < expectedRange[0] - 10 || section.startEnergy > expectedRange[1] + 10) {
                    issues.push(`${section.name} energy (${section.startEnergy}) outside typical ${genre} range (${expectedRange[0]}-${expectedRange[1]})`);
                    score -= 15;
                }
            }
        });
        
        // Check for energy progression issues
        const transitions = this.calculateEnergyTransitions(energyArc);
        const problematicTransitions = transitions.filter(t => !t.recommended);
        
        if (problematicTransitions.length > 0) {
            issues.push(`${problematicTransitions.length} problematic energy transitions detected`);
            score -= problematicTransitions.length * 10;
            suggestions.push('Consider smoother energy transitions between sections');
        }
        
        // Check for sufficient contrast
        const energyLevels = energyArc.sections.map(s => s.startEnergy);
        const energyRange = Math.max(...energyLevels) - Math.min(...energyLevels);
        
        if (energyRange < 40) {
            issues.push('Insufficient energy contrast throughout arrangement');
            score -= 20;
            suggestions.push('Add more dynamic range with higher peaks and lower valleys');
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            suggestions,
            score: Math.max(0, score)
        };
    }
    
    // Private helper methods
    
    private static getEnergyProfile(genre: string): any {
        return this.ENERGY_PROFILES[genre as keyof typeof this.ENERGY_PROFILES] || this.ENERGY_PROFILES.house;
    }
    
    private static designSectionArcs(
        sections: string[], 
        totalLength: number, 
        energyProfile: any
    ): EnergyArc['sections'] {
        const sectionArcs = [];
        const avgSectionLength = Math.floor(totalLength / sections.length);
        
        for (let i = 0; i < sections.length; i++) {
            const sectionName = sections[i];
            const normalizedName = sectionName.toLowerCase().replace(/\s+/g, '').replace(/\d+/g, '');
            
            // Get energy range for this section type
            const energyRange = energyProfile[normalizedName] || [40, 60];
            
            // Determine energy profile based on section type and position
            const energyProfileType = this.determineSectionEnergyProfile(normalizedName, i, sections.length);
            
            // Calculate start and end energy
            let startEnergy, endEnergy;
            
            if (energyProfileType === 'building') {
                startEnergy = energyRange[0];
                endEnergy = energyRange[1];
            } else if (energyProfileType === 'dropping') {
                startEnergy = energyRange[1];
                endEnergy = energyRange[0];
            } else {
                // Constant energy
                const avgEnergy = (energyRange[0] + energyRange[1]) / 2;
                startEnergy = avgEnergy;
                endEnergy = avgEnergy;
            }
            
            sectionArcs.push({
                name: sectionName,
                startEnergy: Math.round(startEnergy),
                endEnergy: Math.round(endEnergy),
                energyProfile: energyProfileType,
                peakMoment: energyProfileType === 'building' ? avgSectionLength * 0.8 : undefined
            });
        }
        
        return sectionArcs;
    }
    
    private static determineSectionEnergyProfile(
        sectionName: string, 
        position: number, 
        totalSections: number
    ): 'constant' | 'building' | 'dropping' | 'dynamic' {
        // Specific section types
        if (sectionName.includes('buildup') || sectionName.includes('build')) {
            return 'building';
        }
        if (sectionName.includes('breakdown') || sectionName.includes('outro')) {
            return 'dropping';
        }
        if (sectionName.includes('bridge')) {
            return 'dynamic';
        }
        
        // Position-based logic
        if (position === 0) return 'building'; // First section usually builds
        if (position === totalSections - 1) return 'dropping'; // Last section usually drops
        
        return 'constant';
    }
    
    private static determineTotalEnergyFlow(
        sections: EnergyArc['sections'], 
        genre: string
    ): 'linear' | 'wave' | 'plateau' | 'custom' {
        const energyLevels = sections.map(s => s.startEnergy);
        
        // Check for linear progression
        let isLinear = true;
        for (let i = 1; i < energyLevels.length; i++) {
            if (energyLevels[i] < energyLevels[i - 1]) {
                isLinear = false;
                break;
            }
        }
        
        if (isLinear) return 'linear';
        
        // Check for wave pattern (multiple peaks)
        let peaks = 0;
        for (let i = 1; i < energyLevels.length - 1; i++) {
            if (energyLevels[i] > energyLevels[i - 1] && energyLevels[i] > energyLevels[i + 1]) {
                peaks++;
            }
        }
        
        if (peaks >= 2) return 'wave';
        
        // Check for plateau (sustained high energy)
        const highEnergyCount = energyLevels.filter(e => e > 70).length;
        if (highEnergyCount >= sections.length * 0.6) return 'plateau';
        
        return 'custom';
    }
    
    private static validateGenreTypical(sections: EnergyArc['sections'], genre: string): boolean {
        const energyProfile = this.getEnergyProfile(genre);
        let typicalCount = 0;
        
        sections.forEach(section => {
            const sectionName = section.name.toLowerCase().replace(/\s+/g, '').replace(/\d+/g, '');
            const expectedRange = energyProfile[sectionName];
            
            if (expectedRange) {
                const isInRange = section.startEnergy >= expectedRange[0] - 5 && 
                                section.startEnergy <= expectedRange[1] + 5;
                if (isInRange) typicalCount++;
            }
        });
        
        return typicalCount >= sections.length * 0.7; // 70% of sections should be typical
    }
    
    private static getSectionPriorities(genre: string): {[key: string]: number} {
        const basePriorities = {
            'intro': 1,
            'verse': 2, 
            'buildup': 3,
            'chorus': 4,
            'drop': 5,
            'breakdown': 6,
            'bridge': 7,
            'outro': 8
        };
        
        // Genre-specific adjustments
        if (genre === 'techno') {
            basePriorities['drop'] = 2; // Techno prioritizes drops early
            basePriorities['breakdown'] = 3;
        } else if (genre === 'trance') {
            basePriorities['buildup'] = 2; // Trance loves buildups
            basePriorities['breakdown'] = 7; // Emotional breakdowns later
        }
        
        return basePriorities;
    }
    
    private static getTransitionType(energyChange: number): 'smooth' | 'dramatic' | 'buildup' | 'drop' {
        if (Math.abs(energyChange) <= 10) return 'smooth';
        if (energyChange > 20) return 'buildup';
        if (energyChange < -20) return 'drop';
        return 'dramatic';
    }
    
    private static isRecommendedTransition(fromSection: string, toSection: string, energyChange: number): boolean {
        const from = fromSection.toLowerCase();
        const to = toSection.toLowerCase();
        
        // Smooth transitions are generally good
        if (Math.abs(energyChange) <= 15) return true;
        
        // Specific good transitions
        if (from.includes('buildup') && to.includes('drop') && energyChange > 0) return true;
        if (from.includes('chorus') && to.includes('breakdown') && energyChange < -20) return true;
        if (from.includes('verse') && to.includes('chorus') && energyChange > 0) return true;
        
        // Avoid problematic transitions
        if (from.includes('drop') && to.includes('buildup')) return false;
        if (Math.abs(energyChange) > 40) return false;
        
        return true;
    }
} 