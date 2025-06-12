# Development Guide

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Figma Desktop App** (for plugin development)
- **TypeScript** knowledge
- **Git** for version control

### Initial Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-username/arreglo.git
cd arreglo
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Add your API keys for testing
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

4. **Build Development Version**
```bash
npm run dev
```

### Development Workflow

#### Plugin Development
1. **Build in Watch Mode**
```bash
npm run dev
```

2. **Import into Figma**
   - Open Figma Desktop
   - Go to Plugins → Development → Import plugin from manifest
   - Select `manifest.json` from project root
   - Plugin will update automatically on code changes

3. **Testing in Figma**
   - Create new Figma/FigJam file
   - Run plugin from Plugins menu
   - Test features and report issues

#### Code Structure

```
src/
├── code.ts              # Main plugin thread (Figma API)
├── core/                # Core business logic
│   ├── api/            # AI service integrations
│   ├── services/       # Business services
│   ├── types.ts        # TypeScript interfaces
│   ├── prompts.ts      # AI prompt engineering
│   └── utils.ts        # Utility functions
├── services/           # High-level services
├── ui/                 # Plugin UI components
│   ├── index.html      # Main UI template
│   ├── app.ts          # UI logic
│   └── styles/         # CSS styling
└── daw_scripts/        # DAW integration scripts
```

## Contributing Guidelines

### Code Style

**TypeScript Standards**
```typescript
// Use interfaces for data structures
interface SongData {
    title: string;
    genre: string;
    patterns: Pattern[];
}

// Use async/await for promises
async function generateArrangement(data: SongData): Promise<ArrangementData> {
    try {
        const result = await callAI(data);
        return parseResult(result);
    } catch (error) {
        console.error('Generation failed:', error);
        throw error;
    }
}

// Use descriptive function names
function createVisualArrangementGrid(arrangement: ArrangementData): void {
    // Implementation
}
```

**Naming Conventions**
- **Files**: kebab-case (`pattern-analyzer.ts`)
- **Functions**: camelCase (`generateArrangement`)
- **Classes**: PascalCase (`PatternAnalyzer`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TEMPO`)
- **Interfaces**: PascalCase (`SongData`)

### Git Workflow

**Branch Naming**
```bash
feature/export-system
bugfix/pattern-analysis-error
hotfix/ui-crash-on-load
docs/api-documentation
```

**Commit Messages**
```bash
feat: add MIDI export functionality
fix: resolve pattern analyzer crash on empty input
docs: update architecture documentation
refactor: simplify AI service abstraction
test: add unit tests for pattern analysis
```

**Pull Request Process**
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

### Testing Strategy

#### Unit Tests (Planned)
```typescript
// Example test structure
describe('PatternAnalyzer', () => {
    test('should correctly identify four-on-the-floor patterns', () => {
        const pattern = 'kick - 4x';
        const metadata = PatternAnalyzer.analyzeName(pattern);
        expect(metadata.timing).toBe('four-on-the-floor');
    });
    
    test('should handle empty pattern names gracefully', () => {
        const result = PatternAnalyzer.analyzeName('');
        expect(result).toEqual(DEFAULT_PATTERN_METADATA);
    });
});
```

#### Integration Tests
```typescript
// Test AI service integration
describe('AI Services', () => {
    test('should generate valid arrangement from song data', async () => {
        const songData: SongData = createTestSongData();
        const arrangement = await generateArrangement(config, songData);
        expect(arrangement.sections).toHaveLength.greaterThan(0);
    });
});
```

#### Manual Testing Checklist
- [ ] Plugin loads in Figma without errors
- [ ] All form fields accept valid input
- [ ] AI generation produces valid arrangements
- [ ] Visual rendering displays correctly
- [ ] Settings save and persist
- [ ] Error messages display appropriately

## Architecture Patterns

### Service Layer Pattern

**AI Service Abstraction**
```typescript
// Abstract interface
interface AIProvider {
    generateArrangement(prompt: string): Promise<string>;
}

// Concrete implementations
class OpenAIProvider implements AIProvider {
    async generateArrangement(prompt: string): Promise<string> {
        // OpenAI-specific implementation
    }
}

class AnthropicProvider implements AIProvider {
    async generateArrangement(prompt: string): Promise<string> {
        // Anthropic-specific implementation
    }
}

// Service coordination
class AIService {
    private providers: Map<string, AIProvider>;
    
    async generate(config: ApiConfig, prompt: string): Promise<string> {
        const provider = this.providers.get(config.PREFERRED_API);
        return await provider.generateArrangement(prompt);
    }
}
```

### Plugin Communication Pattern

**UI to Main Thread**
```typescript
// UI thread sends message
parent.postMessage({
    pluginMessage: {
        type: 'generate-arrangement',
        songData: formData
    }
}, '*');

// Main thread receives message
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'generate-arrangement') {
        try {
            const arrangement = await generateArrangement(msg.songData);
            await createVisualArrangement(arrangement);
            figma.ui.postMessage({ type: 'success' });
        } catch (error) {
            figma.ui.postMessage({ 
                type: 'error', 
                message: error.message 
            });
        }
    }
};
```

### Error Handling Pattern

**Graceful Degradation**
```typescript
async function generateArrangementWithFallback(
    config: ApiConfig, 
    prompt: string
): Promise<string> {
    const providers = [
        config.PREFERRED_API === 'openai' ? 'openai' : 'anthropic',
        config.PREFERRED_API === 'openai' ? 'anthropic' : 'openai'
    ];
    
    for (const provider of providers) {
        try {
            return await callProvider(provider, prompt);
        } catch (error) {
            console.warn(`${provider} failed, trying next provider:`, error);
        }
    }
    
    throw new Error('All AI providers failed');
}
```

## Debugging

### Figma Plugin Debugging

**Console Logging**
```typescript
// Main thread debugging
console.log('Arrangement data:', arrangement);
figma.ui.postMessage({ type: 'log', data: arrangement });

// UI thread debugging  
console.log('Form data:', formData);
```

**Error Tracking**
```typescript
// Centralized error handling
function handleError(error: Error, context: string) {
    console.error(`Error in ${context}:`, error);
    
    // Send to analytics if user consented
    if (config.DATA_COLLECTION_CONSENT) {
        AnalyticsService.trackError(error, context);
    }
    
    // Show user-friendly message
    showErrorMessage(error.message);
}
```

### Common Issues

**Plugin Won't Load**
- Check `manifest.json` syntax
- Verify file paths in manifest
- Ensure all dependencies are built
- Check browser console for errors

**AI Generation Fails**
- Verify API keys are configured
- Check network connectivity
- Validate prompt format
- Test with simple inputs first

**Visual Rendering Issues**
- Check Figma node creation syntax
- Verify font loading
- Test with minimal arrangements
- Check for memory issues with large arrangements

## Adding New Features

### 1. Pattern Types

**Add New Pattern Recognition**
```typescript
// Extend PatternAnalyzer
class PatternAnalyzer {
    static analyzeName(name: string): PatternMetadata {
        // Add new pattern detection logic
        if (name.includes('latin')) {
            return {
                type: 'percussion',
                timing: 'latin-rhythm',
                function: 'groove',
                role: 'rhythmic'
            };
        }
        // ... existing logic
    }
}
```

### 2. Export Formats

**Add New Export Type**
```typescript
// Create new export service
class CSVExportService {
    export(arrangement: ArrangementData): string {
        const headers = ['Section', 'Instrument', 'Bars'];
        const rows = arrangement.sections.flatMap(section =>
            Object.entries(section.instruments).map(([instrument, bars]) =>
                [section.name, instrument, bars.join(';')]
            )
        );
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// Register in export system
ExportManager.registerExporter('csv', new CSVExportService());
```

### 3. AI Providers

**Add New AI Service**
```typescript
// Implement provider interface
class CoHereProvider implements AIProvider {
    constructor(private apiKey: string) {}
    
    async generateArrangement(prompt: string): Promise<string> {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'command',
                prompt: prompt,
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        return data.generations[0].text;
    }
}

// Register provider
AIService.registerProvider('cohere', CoHereProvider);
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy dependencies
const loadAIService = async () => {
    const { AIService } = await import('./services/AIService');
    return new AIService();
};
```

### Caching
```typescript
// Cache pattern analysis results
class PatternCache {
    private cache = new Map<string, PatternMetadata>();
    
    analyze(pattern: string): PatternMetadata {
        if (this.cache.has(pattern)) {
            return this.cache.get(pattern)!;
        }
        
        const result = PatternAnalyzer.analyzeName(pattern);
        this.cache.set(pattern, result);
        return result;
    }
}
```

### Memory Management
```typescript
// Clean up Figma nodes efficiently
function cleanupNodes(nodes: SceneNode[]) {
    // Batch operations for better performance
    nodes.forEach(node => node.remove());
}
```

## Release Process

### Version Management
```bash
# Update version
npm version patch|minor|major

# Build production version
npm run build

# Test production build
# Deploy to Figma Community Store
```

### Documentation Updates
- Update README.md with new features
- Add changelog entries
- Update API documentation
- Create migration guides for breaking changes

### Quality Checklist
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped appropriately 