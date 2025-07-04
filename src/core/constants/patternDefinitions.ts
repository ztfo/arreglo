export const PATTERN_COMPONENTS = {
    bases: [
        // Rhythm Section
        'kick', 'clap', 'snare', 'hat', 'hihat', 'cymbal', 'perc', 'percussion',
        'shaker', 'tambourine', 'cowbell', 'rim', 'clave',
        
        // Bass Elements
        'bass', 'bassline', 'sub', 'subbass', '808',
        
        // Harmonic Elements
        'synth', 'lead', 'chord', 'chords', 'pad', 'stab', 'stabs',
        'arp', 'arpeggios', 'sequence', 'pluck',
        
        // Vocal Elements
        'vox', 'vocal', 'vocals', 'voice', 'choir', 'talk', 'whisper',
        
        // Effects & Atmosphere
        'fx', 'sfx', 'sweep', 'riser', 'noise', 'vinyl', 'tape',
        'ambient', 'texture', 'atmosphere', 'space'
    ],
    types: [
        'loop', 'sample', 'pattern', 'riff', 'oneshot',
        'fill', 'impact', 'texture', 'layer', 'ghost',
        'polyrhythm', 'counter', 'sidechain'
    ],
    complexities: [
        'simple', 'complex', 'basic', 'advanced',
        'minimal', 'dense', 'sparse', 'intricate', 'layered'
    ],
    functions: [
        'buildup', 'riser', 'breakdown', 'transition',
        'drop', 'intro', 'outro', 'bridge', 'filter',
        'sweep', 'impact', 'accent', 'fill', 'glitch'
    ],
    timing: [
        '4x', 'offbeat', 'swing', 'straight', 'shuffle',
        'triplet', 'syncopated', 'groove', '16th', '8th',
        'dotted', 'polyrhythm', 'counter'
    ],
    roles: [
        'lead', 'backing', 'rhythm', 'accent', 'foundation',
        'bass', 'melody', 'harmony', 'atmosphere', 'support',
        'feature', 'texture', 'driving', 'floating'
    ]
};

// Frequency range mappings for dance music mixing
export const FREQUENCY_RANGES = {
    'sub': ['kick', 'sub', 'subbass', '808'], // 20-60Hz
    'bass': ['bass', 'bassline'], // 60-250Hz  
    'lowMid': ['kick', 'snare', 'clap'], // 250-500Hz
    'mid': ['synth', 'lead', 'chord', 'vocal', 'vox'], // 500Hz-2kHz
    'highMid': ['synth', 'lead', 'vocal', 'snare', 'clap'], // 2-8kHz
    'high': ['hat', 'hihat', 'cymbal', 'shaker', 'fx'] // 8kHz+
};

// Energy contribution levels for arrangement dynamics
export const ENERGY_LEVELS = {
    'foundation': ['kick', 'bass', 'bassline'], // 7-9/10
    'driving': ['hat', 'hihat', 'synth', 'lead'], // 5-7/10
    'supporting': ['pad', 'chord', 'arp'], // 3-5/10
    'atmospheric': ['fx', 'ambient', 'texture', 'space'], // 1-3/10
    'accent': ['clap', 'snare', 'stab', 'impact'] // Variable 2-8/10
};

// Rhythmic complexity indicators
export const RHYTHMIC_COMPLEXITY = {
    'simple': ['4x', 'straight', 'basic'],
    'moderate': ['offbeat', 'swing', 'groove', 'syncopated'],
    'complex': ['triplet', '16th', 'polyrhythm', 'counter', 'dotted'],
    'polyrhythmic': ['polyrhythm', 'counter', 'intricate', 'layered']
};

// Genre affinities for pattern types
export const GENRE_AFFINITIES = {
    'house': {
        essential: ['kick', '4x', 'hihat', 'offbeat', 'chord', 'stab'],
        preferred: ['bassline', 'groove', 'swing', 'vocal', 'sample'],
        avoided: ['aggressive', 'industrial', 'distorted']
    },
    'techno': {
        essential: ['kick', '4x', 'hihat', 'synth', 'industrial'],
        preferred: ['driving', 'minimal', 'sequence', 'noise', 'texture'],
        avoided: ['swing', 'vocal', 'organic']
    },
    'trance': {
        essential: ['kick', '4x', 'arp', 'lead', 'pad', 'buildup'],
        preferred: ['emotional', 'atmospheric', 'sequence', 'sweep', 'riser'],
        avoided: ['minimal', 'sparse', 'industrial']
    }
};

// Enhanced section rules with energy arcs and dance music patterns
export const SECTION_RULES = {
    'Intro': {
        preferredPatterns: ['simple', 'minimal', 'atmosphere', 'texture'],
        avoidPatterns: ['complex', 'dense', 'aggressive'],
        maxIntensity: 2,
        energyRange: [10, 25], // 10-25% energy
        typicalDuration: [16, 32],
        frequencyFocus: ['mid', 'high', 'atmospheric']
    },
    'Verse': {
        preferredPatterns: ['groove', 'backing', 'rhythm', 'foundation'],
        avoidPatterns: ['intense', 'buildup', 'drop'],
        maxIntensity: 4,
        energyRange: [30, 50], // 30-50% energy
        typicalDuration: [16, 32],
        frequencyFocus: ['bass', 'mid', 'foundation']
    },
    'Chorus': {
        preferredPatterns: ['lead', 'complex', 'dense', 'driving'],
        avoidPatterns: ['minimal', 'sparse', 'breakdown'],
        maxIntensity: 8,
        energyRange: [60, 85], // 60-85% energy
        typicalDuration: [16, 32],
        frequencyFocus: ['full-spectrum']
    },
    'Build-up': {
        preferredPatterns: ['buildup', 'riser', 'sweep', 'tension'],
        avoidPatterns: ['breakdown', 'minimal', 'sparse'],
        maxIntensity: 7,
        energyRange: [40, 80], // Growing energy
        typicalDuration: [8, 16],
        frequencyFocus: ['mid', 'highMid', 'high']
    },
    'Drop': {
        preferredPatterns: ['impact', 'dense', 'aggressive', 'driving'],
        avoidPatterns: ['minimal', 'atmospheric', 'sparse'],
        maxIntensity: 10,
        energyRange: [85, 100], // Maximum energy
        typicalDuration: [16, 32],
        frequencyFocus: ['full-spectrum', 'bass-heavy']
    },
    'Breakdown': {
        preferredPatterns: ['minimal', 'atmospheric', 'simple', 'texture'],
        avoidPatterns: ['complex', 'dense', 'aggressive'],
        maxIntensity: 3,
        energyRange: [20, 40], // Low energy
        typicalDuration: [8, 16],
        frequencyFocus: ['mid', 'atmospheric']
    },
    'Bridge': {
        preferredPatterns: ['feature', 'solo', 'emotional', 'contrast'],
        avoidPatterns: ['foundation', 'typical'],
        maxIntensity: 6,
        energyRange: [40, 70], // Variable energy
        typicalDuration: [16, 32],
        frequencyFocus: ['mid', 'highMid', 'feature']
    },
    'Outro': {
        preferredPatterns: ['breakdown', 'fade', 'minimal', 'atmospheric'],
        avoidPatterns: ['buildup', 'intense', 'aggressive'],
        maxIntensity: 2,
        energyRange: [10, 30], // Decreasing energy
        typicalDuration: [16, 32],
        frequencyFocus: ['mid', 'high', 'atmospheric']
    }
}; 