# Arreglo Documentation

## Project Overview

Arreglo is an AI-powered music arrangement visualization tool that helps music producers plan and visualize song structures. Currently implemented as a Figma plugin with plans for DAW integration and VST development.

## Documentation Structure

- [**Architecture**](./architecture.md) - Technical architecture and system design
- [**API Reference**](./api-reference.md) - Core APIs and interfaces
- [**Development Guide**](./development-guide.md) - How to contribute and develop
- [**Roadmap**](./roadmap.md) - Current plans and future features
- [**User Guide**](./user-guide.md) - How to use Arreglo
- [**Extension Plans**](./extension-plans.md) - Ideas for extending the project
- [**Export System**](./export-system.md) - Multi-format export implementation details

## Quick Start

1. **For Users**: See [User Guide](./user-guide.md)
2. **For Developers**: See [Development Guide](./development-guide.md)
3. **For Architecture**: See [Architecture](./architecture.md)

## Current Status

- ✅ **Figma Plugin**: Live on Figma Community Store
- ✅ **Export System**: Multi-format export (JSON, MIDI, CSV) implemented
- 🚧 **FL Studio Integration**: Python script in development
- 📋 **VST Plugin**: Planned, beta signup available

## Key Features

- **Semantic Pattern Recognition**: Understands musical context (e.g., "kick - 4x", "bassline - chords")
- **AI-Powered Generation**: Uses OpenAI/Anthropic for intelligent arrangements
- **Visual Timeline**: Grid-based visualization of instrument patterns
- **Multi-Genre Support**: Genre-aware arrangement generation
- **Creativity Control**: Adjustable AI creativity levels (traditional to experimental)

## Technology Stack

- **Frontend**: TypeScript, HTML/CSS
- **Platform**: Figma Plugin API
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **Build**: Webpack
- **Future**: VST3, DAW Integration 