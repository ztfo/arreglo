# Architecture

## System Overview

Arreglo is designed as a modular system with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Figma Plugin  │    │   AI Services   │    │   DAW Scripts   │
│     (Current)   │    │   (OpenAI/      │    │   (FL Studio)   │
│                 │    │   Anthropic)    │    │   (Planned)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────▼─────────────────┐
                │         Core Engine               │
                │  • Pattern Analysis               │
                │  • Arrangement Generation         │
                │  • Semantic Understanding         │
                └───────────────────────────────────┘
```

## Directory Structure

```
src/
├── core/                    # Core business logic
│   ├── api/                # AI service abstractions
│   │   ├── index.ts        # Main API router
│   │   ├── openai.ts       # OpenAI integration
│   │   └── anthropic.ts    # Anthropic integration
│   ├── services/           # Business services
│   │   └── PatternAnalyzer.ts # Pattern semantic analysis
│   ├── constants/          # Configuration constants
│   ├── types.ts            # TypeScript interfaces
│   ├── prompts.ts          # AI prompt engineering
│   ├── utils.ts            # Utility functions
│   ├── config.ts           # Configuration management
│   └── supabase.ts         # Analytics backend
├── services/               # High-level services
│   ├── AIService.ts        # AI service coordination
│   └── AnalyticsService.ts # Usage analytics
├── ui/                     # Figma plugin UI
│   ├── components/         # UI components
│   ├── styles/             # CSS styling
│   ├── assets/             # Static assets
│   ├── icons/              # Icon definitions
│   ├── index.html          # Main UI template
│   ├── app.ts              # UI application logic
│   └── main.ts             # UI entry point
└── code.ts                 # Figma plugin main thread
```

## Core Components

### 1. Pattern Analysis Engine (`src/core/services/PatternAnalyzer.ts`)

Analyzes semantic meaning of pattern names:
- **Input**: Pattern names like "kick - 4x", "bassline - chords"
- **Output**: Structured metadata with timing, function, role
- **Intelligence**: Understands musical conventions and context

### 2. AI Service Layer (`src/core/api/`)

Abstracts AI provider differences:
- **Unified Interface**: Same API for OpenAI/Anthropic
- **Smart Routing**: User preference-based provider selection
- **Error Handling**: Graceful fallbacks between providers

### 3. Arrangement Generator (`src/core/prompts.ts`)

Creates intelligent prompts for AI:
- **Context-Aware**: Uses pattern analysis, genre, creativity level
- **Structured Output**: Enforces consistent response format
- **Musical Intelligence**: Embeds music theory knowledge

### 4. Visual Renderer (`src/code.ts`)

Generates Figma visualizations:
- **Grid Layout**: Timeline-based instrument visualization
- **Color Coding**: Instrument-specific color patterns
- **Responsive Design**: Adapts to arrangement length

## Data Flow

```
1. User Input → 2. Pattern Analysis → 3. Prompt Generation → 4. AI Processing → 5. Visual Rendering

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Song Data   │───▶│ Semantic    │───▶│ AI Prompt   │───▶│ Arrangement │───▶│ Figma       │
│ • Title     │    │ Analysis    │    │ Engineering │    │ Generation  │    │ Visualization│
│ • Genre     │    │ • Pattern   │    │ • Context   │    │ • Sections  │    │ • Grid      │
│ • Patterns  │    │   Metadata  │    │ • Rules     │    │ • Timing    │    │ • Colors    │
│ • Sections  │    │ • Rules     │    │ • Examples  │    │ • Logic     │    │ • Labels    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Key Interfaces

### `SongData`
```typescript
interface SongData {
    title: string;
    genre: string;
    length: number;
    tempo: number;
    instruments: string[];
    patterns: Pattern[];
    creativity: number;
    selectedSections: string[];
}
```

### `ArrangementData`
```typescript
interface ArrangementData {
    title: string;
    genre?: string;
    sections: SongSection[];
    rawResponse: string;
}
```

### `SongSection`
```typescript
interface SongSection {
    name: string;
    duration: number;
    instruments: {
        [instrument: string]: number[];
    };
}
```

## Plugin Integration

### Figma Plugin API
- **UI Thread**: HTML/CSS/JS for user interface
- **Main Thread**: TypeScript for Figma canvas manipulation
- **Communication**: PostMessage API between threads

### External APIs
- **OpenAI**: GPT-4 for arrangement generation
- **Anthropic**: Claude for alternative AI processing
- **Supabase**: Analytics and user data (with consent)

## Extensibility Points

1. **New AI Providers**: Add to `src/core/api/`
2. **Pattern Types**: Extend `PatternAnalyzer`
3. **Export Formats**: Add to arrangement generator
4. **Visualization Modes**: Extend Figma renderer
5. **DAW Integration**: Add new platform modules

## Performance Considerations

- **Async Processing**: Non-blocking AI calls
- **Caching**: Configuration and pattern analysis results
- **Error Recovery**: Graceful degradation with fallbacks
- **Memory Management**: Efficient Figma node creation 