# API Reference

## Core Interfaces

### SongData
Main interface for song configuration and input data.

```typescript
interface SongData {
    title: string;           // Song title
    genre: string;           // Musical genre
    length: number;          // Song length in bars (16-256)
    tempo: number;           // BPM (60-200)
    instruments: string[];   // Array of instrument/pattern names
    patterns: Pattern[];     // Structured pattern data
    creativity: number;      // Creativity level (1-5)
    selectedSections: string[]; // Requested song sections
    isTest?: boolean;        // Optional test mode flag
}
```

**Example:**
```typescript
const songData: SongData = {
    title: "My Track",
    genre: "House",
    length: 128,
    tempo: 128,
    instruments: ["kick - 4x", "hi-hat - offbeat", "bassline - chords"],
    patterns: [],
    creativity: 3,
    selectedSections: ["Intro", "Verse", "Chorus", "Outro"]
};
```

### ArrangementData
Interface for generated arrangement output.

```typescript
interface ArrangementData {
    title: string;              // Song title
    genre?: string;             // Musical genre
    style?: string;             // Additional style information
    sections: SongSection[];    // Array of arrangement sections
    defaultSections?: string[]; // Default section suggestions
    rawResponse: string;        // Raw AI response for debugging
}
```

### SongSection
Individual section within an arrangement.

```typescript
interface SongSection {
    name: string;               // Section name (e.g., "Verse", "Chorus")
    duration: number;           // Section duration in bars
    instruments: {              // Instrument activation by bar
        [instrument: string]: number[];
    };
    metadata?: {                // Optional pattern metadata
        [instrument: string]: PatternMetadata;
    };
}
```

**Example:**
```typescript
const section: SongSection = {
    name: "Verse",
    duration: 16,
    instruments: {
        "kick - 4x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "hi-hat - offbeat": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "bassline - chords": [9, 10, 11, 12, 13, 14, 15, 16]
    }
};
```

### Pattern
Structured pattern information with metadata.

```typescript
interface Pattern {
    name: string;                 // Pattern name
    metadata?: PatternMetadata;   // Semantic analysis data
    rules?: PatternRule[];        // Arrangement rules
}
```

### PatternMetadata
Semantic analysis of pattern names.

```typescript
interface PatternMetadata {
    base: string;          // Base instrument name
    type?: string;         // Pattern type (e.g., "percussion", "harmonic")
    complexity?: string;   // Complexity level
    function?: string;     // Musical function
    timing?: string;       // Timing characteristic
    role?: string;         // Role in arrangement
}
```

### PatternRule
Rules for intelligent pattern placement.

```typescript
interface PatternRule {
    name: string;              // Rule name
    description: string;       // Human-readable description
    sectionPreference: string[]; // Preferred sections
    intensity: number;         // Intensity level (1-5)
}
```

## Configuration Interfaces

### ApiConfig
Configuration for AI services and user preferences.

```typescript
interface ApiConfig {
    ANTHROPIC_API_KEY: string;     // Anthropic API key
    OPENAI_API_KEY: string;        // OpenAI API key
    PREFERRED_API: 'anthropic' | 'openai'; // Preferred provider
    DATA_COLLECTION_CONSENT: boolean;      // Analytics consent
}
```

### Message
Plugin communication message format.

```typescript
interface Message {
    type: string;           // Message type identifier
    config?: ApiConfig;     // Configuration data
    songData?: SongData;    // Song input data
    message?: string;       // Text message
    pluginMessage?: {       // Nested plugin message
        type: string;
        config?: ApiConfig;
        songData?: SongData;
        message?: string;
    };
}
```

## Core Services

### AI Service API

#### generateArrangement()
Main function for arrangement generation.

```typescript
async function generateArrangement(
    config: ApiConfig, 
    prompt: string
): Promise<string>
```

**Parameters:**
- `config`: API configuration with keys and preferences
- `prompt`: Generated arrangement prompt

**Returns:** Raw AI response string

**Example:**
```typescript
const config: ApiConfig = {
    OPENAI_API_KEY: "sk-...",
    ANTHROPIC_API_KEY: "",
    PREFERRED_API: "openai",
    DATA_COLLECTION_CONSENT: true
};

const prompt = createArrangementPrompt(
    "My Track",
    128,
    "House",
    undefined,
    ["Intro", "Verse", "Chorus"],
    ["kick - 4x", "hi-hat - offbeat"],
    3
);

const response = await generateArrangement(config, prompt);
```

#### callOpenAI()
Direct OpenAI API integration.

```typescript
async function callOpenAI(
    apiKey: string, 
    prompt: string
): Promise<string>
```

#### callAnthropic()
Direct Anthropic API integration.

```typescript
async function callAnthropic(
    apiKey: string, 
    prompt: string
): Promise<string>
```

### Pattern Analysis API

#### PatternAnalyzer.analyzeName()
Analyzes pattern names for semantic meaning.

```typescript
static analyzeName(name: string): PatternMetadata
```

**Parameters:**
- `name`: Pattern name string (e.g., "kick - 4x")

**Returns:** Metadata object with semantic analysis

**Example:**
```typescript
const metadata = PatternAnalyzer.analyzeName("kick - 4x");
// Returns: {
//   base: "kick",
//   type: "percussion", 
//   timing: "four-on-the-floor",
//   function: "rhythm",
//   role: "foundation"
// }
```

#### PatternAnalyzer.getPatternRules()
Gets arrangement rules for pattern metadata.

```typescript
static getPatternRules(metadata: PatternMetadata): PatternRule[]
```

### Configuration API

#### getConfig()
Retrieves stored configuration.

```typescript
async function getConfig(): Promise<ApiConfig>
```

#### setConfig()
Saves configuration to storage.

```typescript
async function setConfig(config: ApiConfig): Promise<void>
```

### Utilities API

#### parseArrangement()
Parses AI response into structured data.

```typescript
function parseArrangement(response: string): ArrangementData
```

**Parameters:**
- `response`: Raw AI response string

**Returns:** Structured arrangement data

#### createArrangementPrompt()
Generates AI prompt from song parameters.

```typescript
function createArrangementPrompt(
    title: string,
    length: number,
    genre?: string,
    style?: string,
    selectedSections?: string[],
    instruments?: string[],
    creativity: number = 2
): string
```

**Parameters:**
- `title`: Song title
- `length`: Length in bars
- `genre`: Musical genre (optional)
- `style`: Style description (optional)
- `selectedSections`: Requested sections (optional)
- `instruments`: Pattern names array (optional)
- `creativity`: Creativity level 1-5 (default: 2)

**Returns:** Formatted prompt string

## Analytics API

### ArrangementAnalytics
Interface for usage analytics data.

```typescript
interface ArrangementAnalytics {
    timestamp: string;          // ISO timestamp
    requestData: {              // Input data
        songData: SongData;
        prompt?: string;
    };
    responseData: {             // Output data
        arrangementData: ArrangementData;
        rawResponse: string;
    };
    metadata: {                 // Processing metadata
        apiUsed: 'openai' | 'anthropic';
        processingTime: number;
        success: boolean;
        error?: string;
    };
    userConsent: boolean;       // User consent flag
}
```

### AnalyticsService
Service for collecting usage data.

```typescript
class AnalyticsService {
    static async trackArrangement(data: ArrangementAnalytics): Promise<void>;
    static async trackError(error: Error, context: string): Promise<void>;
}
```

## Visual Rendering API

### createVisualArrangement()
Main function for Figma visualization creation.

```typescript
async function createVisualArrangement(
    arrangement: ArrangementData
): Promise<void>
```

**Parameters:**
- `arrangement`: Structured arrangement data

**Side Effects:** Creates Figma nodes on canvas

### Helper Functions

#### getColorForInstrument()
Gets consistent color for instrument.

```typescript
function getColorForInstrument(
    instrument: string, 
    instrumentIndex: number
): { r: number, g: number, b: number }
```

#### createPatternBlock()
Creates visual block for pattern.

```typescript
function createPatternBlock(
    instrument: string,
    pattern: string, 
    instrumentIndex: number
): FrameNode
```

#### createInstrumentTrack()
Creates timeline track for instrument.

```typescript
function createInstrumentTrack(
    instrument: string,
    pattern: string,
    startBar: number,
    duration: number,
    trackHeight: number,
    instrumentIndex: number
): [RectangleNode, TextNode]
```

## Constants

### Color Palette
```typescript
const BASE_COLORS = [
    { r: 0.93, g: 0.39, b: 0.39 }, // Red
    { r: 0.47, g: 0.67, b: 0.89 }, // Blue
    { r: 0.56, g: 0.93, b: 0.56 }, // Green
    { r: 0.95, g: 0.77, b: 0.47 }, // Yellow
    { r: 0.78, g: 0.47, b: 0.95 }, // Purple
    { r: 0.95, g: 0.47, b: 0.73 }, // Pink
    { r: 0.47, g: 0.95, b: 0.87 }, // Teal
    { r: 0.95, g: 0.62, b: 0.47 }  // Orange
];
```

### Default Values
```typescript
const DEFAULT_TEMPO = 128;
const DEFAULT_LENGTH = 128;
const DEFAULT_CREATIVITY = 2;
const MIN_TEMPO = 60;
const MAX_TEMPO = 200;
const MIN_LENGTH = 16;
const MAX_LENGTH = 256;
```

## Error Handling

### Error Types
Common error scenarios and handling:

```typescript
// API Configuration Errors
if (!config.OPENAI_API_KEY && !config.ANTHROPIC_API_KEY) {
    throw new Error('No valid API configuration found');
}

// Pattern Analysis Errors
if (instruments.length === 0) {
    throw new Error('No instruments provided for arrangement');
}

// Figma Rendering Errors
try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
} catch (error) {
    console.error('Font loading failed:', error);
    // Fallback to system fonts
}
```

### Validation Functions

#### validateConfig()
```typescript
async function validateConfig(config: ApiConfig): Promise<boolean>
```

#### validateSongData()
```typescript
function validateSongData(data: SongData): boolean {
    return data.title.length > 0 && 
           data.length >= MIN_LENGTH && 
           data.length <= MAX_LENGTH &&
           data.tempo >= MIN_TEMPO && 
           data.tempo <= MAX_TEMPO;
}
```

## Extension Points

### Adding New AI Providers

```typescript
// Implement AIProvider interface
class NewAIProvider implements AIProvider {
    async generateArrangement(prompt: string): Promise<string> {
        // Implementation
    }
}

// Register provider
AIService.registerProvider('newprovider', NewAIProvider);
```

### Adding New Pattern Types

```typescript
// Extend PatternAnalyzer
PatternAnalyzer.addPatternType('latin', {
    timing: 'latin-rhythm',
    function: 'groove',
    preferredSections: ['verse', 'chorus']
});
```

### Adding Export Formats

```typescript
// Implement ExportService interface
interface ExportService {
    export(arrangement: ArrangementData): string | ArrayBuffer;
    getFileExtension(): string;
    getMimeType(): string;
}
```

## Plugin Communication Protocol

### Message Types

#### UI → Main Thread
```typescript
// Generate arrangement request
{
    type: 'generate-arrangement',
    songData: SongData
}

// Configuration update
{
    type: 'update-config',
    config: ApiConfig
}

// Image analysis request
{
    type: 'analyze-image',
    imageData: string  // base64 encoded
}
```

#### Main Thread → UI
```typescript
// Success response
{
    type: 'success',
    message?: string
}

// Error response
{
    type: 'error',
    message: string
}

// Progress update
{
    type: 'progress',
    stage: string,
    progress: number  // 0-100
}
```

---

*This API reference covers the current implementation. For the latest updates, see the source code in the repository.* 