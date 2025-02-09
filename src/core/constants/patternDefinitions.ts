export const PATTERN_COMPONENTS = {
    bases: [
        'kick', 'clap', 'snare', 'hat', 'hihat', 'cymbal',
        'synth', 'bass', 'pad', 'vox', 'vocal', 'lead',
        'chord', 'arp', 'percussion', 'fx'
    ],
    types: [
        'loop', 'sample', 'pattern', 'riff', 'oneshot',
        'fill', 'impact', 'noise', 'texture'
    ],
    complexities: [
        'simple', 'complex', 'basic', 'advanced',
        'minimal', 'dense', 'sparse'
    ],
    functions: [
        'buildup', 'riser', 'breakdown', 'transition',
        'drop', 'intro', 'outro', 'bridge'
    ],
    timing: [
        '4x', 'offbeat', 'swing', 'straight',
        'triplet', 'syncopated', 'groove'
    ],
    roles: [
        'lead', 'backing', 'rhythm', 'accent',
        'bass', 'melody', 'harmony', 'atmosphere'
    ]
};

export const SECTION_RULES = {
    'Intro': {
        preferredPatterns: ['simple', 'minimal', 'atmosphere'],
        avoidPatterns: ['complex', 'intense'],
        maxIntensity: 2
    },
    'Verse': {
        preferredPatterns: ['groove', 'backing', 'rhythm'],
        avoidPatterns: ['intense', 'buildup'],
        maxIntensity: 3
    },
    'Chorus': {
        preferredPatterns: ['lead', 'complex', 'dense'],
        avoidPatterns: ['minimal', 'sparse'],
        maxIntensity: 5
    },
    // Add more section rules...
}; 