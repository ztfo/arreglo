import { PatternAnalyzer } from './services/PatternAnalyzer';
import { PatternRelationshipAnalyzer } from './services/PatternRelationshipAnalyzer';
import { GenreDetector } from './services/GenreDetector';
import { EnergyArcDesigner } from './services/EnergyArcDesigner';
import { PatternMetadata, PatternRule, GenreAnalysis, EnergyArc } from './types';

export function createArrangementPrompt(
    title: string,
    length: number,
    genre?: string,
    style?: string,
    selectedSections?: string[],
    instruments?: string[],
    creativity: number = 2
): string {
    if (!instruments || instruments.length === 0) {
        throw new Error('No instruments provided for arrangement');
    }

    // STAGE 1: Context Analysis
    const contextAnalysis = performContextAnalysis(instruments, genre);
    
    // STAGE 2: Energy Arc Design  
    const energyArc = designEnergyArc(contextAnalysis, selectedSections || [], length);
    
    // STAGE 3: Generate Enhanced Arrangement Prompt
    return generateDetailedArrangementPrompt(
        title, length, contextAnalysis, energyArc, creativity, style
    );
}

// STAGE 1: Context Analysis
function performContextAnalysis(instruments: string[], targetGenre?: string): {
    genreAnalysis: any;
    patternAnalysis: Array<{name: string, metadata: PatternMetadata, rules: PatternRule[]}>;
    relationships: any[];
    complementaryGroups: {[key: string]: string[]};
    conflictingPatterns: {[key: string]: string[]};
} {
    // Analyze each pattern with enhanced metadata
    const patternAnalysis = instruments.map(name => ({
        name,
        metadata: PatternAnalyzer.analyzeName(name),
        rules: PatternAnalyzer.getPatternRules(PatternAnalyzer.analyzeName(name))
    }));

    // Detect or validate genre
    const genreAnalysis = targetGenre ? 
        { detectedGenre: targetGenre, confidence: 1.0 } :
        GenreDetector.detectGenre(instruments);

    // Analyze pattern relationships
    const relationships = PatternRelationshipAnalyzer.analyzePatternSet(instruments);
    
    // Group complementary and conflicting patterns
    const complementaryGroups: {[key: string]: string[]} = {};
    const conflictingPatterns: {[key: string]: string[]} = {};
    
    instruments.forEach(pattern => {
        complementaryGroups[pattern] = PatternRelationshipAnalyzer.findComplementaryPatterns(pattern, instruments);
        conflictingPatterns[pattern] = PatternRelationshipAnalyzer.findConflictingPatterns(pattern, instruments);
    });

    return {
        genreAnalysis,
        patternAnalysis,
        relationships,
        complementaryGroups,
        conflictingPatterns
    };
}

// STAGE 2: Energy Arc Design
function designEnergyArc(
    contextAnalysis: any, 
    selectedSections: string[], 
    length: number
): EnergyArc {
    const detectedGenre = contextAnalysis.genreAnalysis.detectedGenre || 'house';
    const patterns = contextAnalysis.patternAnalysis.map((p: any) => p.name);
    
    // Use selected sections or suggest optimal ones
    const sections = selectedSections.length > 0 ? 
        selectedSections : 
        EnergyArcDesigner.suggestSectionOrder(['Intro', 'Verse', 'Chorus', 'Build-up', 'Drop', 'Outro'], length, detectedGenre);
    
    return EnergyArcDesigner.designEnergyArc(sections, length, patterns, detectedGenre);
}

// STAGE 3: Generate Detailed Arrangement Prompt
function generateDetailedArrangementPrompt(
    title: string,
    length: number, 
    contextAnalysis: any,
    energyArc: EnergyArc,
    creativity: number,
    style?: string
): string {
    const { genreAnalysis, patternAnalysis, complementaryGroups } = contextAnalysis;
    const detectedGenre = genreAnalysis.detectedGenre || 'house';
    
    const creativityDescription = creativity <= 1 ? 'traditional'
        : creativity <= 2 ? 'balanced'
        : creativity <= 3 ? 'modern'
        : creativity <= 4 ? 'innovative'
        : 'experimental';

    const genreConfidence = genreAnalysis.confidence || 1;
    const genreGuidance = genreConfidence > 0.7 ? 
        `Strong ${detectedGenre} characteristics detected` :
        `Moderate ${detectedGenre} influence detected`;

    return `As an expert ${detectedGenre} arrangement specialist, create a professional dance music arrangement:

=== TRACK INFORMATION ===
Title: ${title}
Genre: ${detectedGenre} (${genreGuidance})
${style ? `Style: ${style}` : ''}
Creativity Level: ${creativityDescription} (${creativity}/5)
Total Length: ${length} bars
Energy Flow: ${energyArc.totalEnergyFlow} pattern

=== AVAILABLE PATTERNS ===
${patternAnalysis.map((p: any) => `- ${p.name} [Energy: ${p.metadata.energyContribution}/10, Role: ${p.metadata.harmonicRole}, Freq: ${p.metadata.frequencyRange?.join(', ') || 'mid'}]`).join('\n')}

=== ENERGY ARC DESIGN ===
${energyArc.sections.map(section => 
    `${section.name}: ${section.startEnergy}→${section.endEnergy}% energy (${section.energyProfile} profile)`
).join('\n')}

=== PATTERN RELATIONSHIPS ===
${Object.entries(complementaryGroups).map(([pattern, companions]) => 
    (companions as string[]).length > 0 ? `${pattern} works well with: ${(companions as string[]).slice(0, 3).join(', ')}` : ''
).filter(Boolean).slice(0, 5).join('\n')}

=== ARRANGEMENT RULES ===
- CRITICAL: Total length must be EXACTLY ${length} bars
- Use only the exact pattern names provided above
- Follow the energy targets for each section
- Respect pattern relationships and frequency ranges
- Layer patterns according to their harmonic roles (foundation → melody → harmony → texture)
- Each section duration must contribute to the exact total length

=== SECTION FORMAT ===
For each section, use this exact format:

SECTION: [section name]
DURATION: [number of bars]
ENERGY_TARGET: [target energy level from energy arc]
INSTRUMENT: [instrument name]
BARS: [comma-separated bar numbers relative to section start]
ROLE: [foundation/melody/harmony/texture/accent]
END_INSTRUMENT
END_SECTION

IMPORTANT: Bar numbers should be relative to each section start (e.g., for a 16-bar section, use "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16" for full section)

=== ${detectedGenre.toUpperCase()} ARRANGEMENT PRINCIPLES ===
${generateGenreSpecificGuidance(detectedGenre, creativity)}

Separate sections with three dashes (---) and ensure all bar numbers add up to exactly ${length} bars.`;
}

function generatePatternDescriptions(
    patterns: Array<{name: string, metadata: PatternMetadata, rules: PatternRule[]}>
): string {
    const descriptions: string[] = [];
    
    patterns.forEach(({name, metadata, rules}) => {
        const ruleDescriptions = rules.map(r => r.description);
        const components: string[] = [];
        
        if (metadata.type) components.push(metadata.type);
        if (metadata.timing) components.push(metadata.timing);
        if (metadata.function) components.push(metadata.function);
        if (metadata.role) components.push(metadata.role);
        
        const componentDesc = components.length > 0 ? ` (${components.join(', ')})` : '';
        descriptions.push(`- ${name}${componentDesc}: ${ruleDescriptions.join(', ')}`);
    });

    return descriptions.join('\n');
}

function generatePatternGuidelines(
    patterns: Array<{name: string, metadata: PatternMetadata, rules: PatternRule[]}>,
    creativity: number
): string {
    const guidelines: string[] = [];
    const intensityMultiplier = (creativity / 2.5); // Normalize creativity to a 0-2 scale
    
    patterns.forEach(({name, metadata, rules}) => {
        const avgIntensity = rules.reduce((sum, r) => sum + r.intensity, 0) / rules.length;
        const adjustedIntensity = Math.min(5, Math.round(avgIntensity * intensityMultiplier));
        
        const sections = rules
            .flatMap(r => r.sectionPreference)
            .filter((v, i, a) => a.indexOf(v) === i);
            
        if (sections.length > 0) {
            guidelines.push(
                `- ${name}: Use in ${sections.join(', ')} with intensity ${adjustedIntensity}/5`
            );
        }
    });

    return guidelines.join('\n');
}

function generateGenreSpecificGuidance(genre: string, creativity: number): string {
    const genreGuidance: { [key: string]: string } = {
        house: `- Foundation: Kick on every beat (4x pattern), off-beat hi-hats
- Groove: Swing timing, emphasis on groove and feel
- Build-ups: Gradual filter sweeps, percussion layers
- Drops: Controlled energy, maintain groove
- Vocals: Use vocal samples strategically for impact`,
        
        techno: `- Foundation: Driving 4x kick, consistent energy
- Percussion: Minimal, precise, industrial sounds
- Build-ups: Intensity through filtering and effects
- Drops: Maximum energy, relentless driving force
- Atmosphere: Dark, mechanical, hypnotic repetition`,
        
        trance: `- Foundation: Uplifting 4x kick, emotional progression
- Melodic: Arpeggiated sequences, emotional leads
- Build-ups: Epic, extended with rising tension
- Drops: Euphoric release, maximum emotional impact
- Breakdown: Emotional, atmospheric, prepare for next build`
    };
    
    const guidance = genreGuidance[genre.toLowerCase()] || genreGuidance.house;
    
    const creativityNote = creativity >= 4 ? 
        '\n- Feel free to break conventions while maintaining genre essence' :
        creativity >= 3 ? 
        '\n- Balance traditional elements with modern touches' :
        '\n- Stay true to classic genre conventions';
    
    return guidance + creativityNote;
} 