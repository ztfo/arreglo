## Arreglo — AI arrangement assistant for house, techno, and trance

Arreglo turns simple pattern ideas into full song arrangements. I built it to help sketch faster and stay in the flow. It lives in Figma today, with a VST and web app on the way.

## Try it
**[Get it on the Figma Community](https://www.figma.com/community/plugin/1473434918581718662/arreglo)**

![Plugin demo](images/ui-gifs/generate-arrangement-flow.gif)

## How to use
1. Install from the Figma Community and open `Plugins → Arreglo`.
2. Add your OpenAI API key in settings.
3. Enter your song info and patterns.
4. Generate. Tweak anything you want.

Example input:
```
Title: Midnight Drive
Genre: House
Tempo: 124 bpm
Length: 128 bars

Patterns:
- kick-4x
- bassline-rolling
- piano-chords-stab
- vocal-hook-filtered
- hi-hat-shaker
- breakdown-riser
```

## Example output
![Example arrangement](images/current-example.jpg)

What you’re seeing:
- Left: pattern names and roles
- Grid: when each pattern plays
- Structure: intro → verse → chorus → build → drop → outro

## Features (short)
- Genre-aware arranger for house, techno, and trance
- 50+ common pattern types with energy and frequency mapping
- Automatic genre detection and confidence scoring
- Five creativity levels from classic to experimental

## Requirements
- Figma Desktop or Web
- OpenAI API key
- Internet connection

## Docs
- [Backend refactor plan](docs/backend-refactor-plan.md)
- [Payment system integration](docs/payment-system-integration.md)

## License
Commercial license — all rights reserved. You can use Arreglo to create and sell music. You may not redistribute the codebase, repackage it, or host it as a competing service without written permission.
