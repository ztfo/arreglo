# User Guide

## Getting Started with Arreglo

Arreglo is an AI-powered music arrangement plugin for Figma that helps you visualize and plan song structures quickly and intelligently.

### Installation

1. **Open Figma** (Desktop or Web)
2. **Go to Community** → Search for "Arreglo"
3. **Install the Plugin** from the Community Store
4. **Run Plugin** from Plugins menu

### First Time Setup

#### Configure API Keys
1. **Open Settings** (gear icon in bottom-left of plugin)
2. **Add API Key** - Choose either:
   - **OpenAI**: For GPT-4 powered generation
   - **Anthropic**: For Claude powered generation
3. **Select Preferred AI** provider
4. **Save Settings**

> 💡 **Tip**: Both providers work well, but you might prefer one based on style or response speed.

#### Data Collection (Optional)
- **Anonymous Analytics**: Help improve Arreglo by allowing anonymous data collection
- **What's Collected**: Arrangement patterns and success rates (never personal data)
- **What's Not Collected**: Song titles, personal information, or API keys

## Creating Your First Arrangement

### Basic Workflow

#### 1. Song Information
- **Song Name**: Enter your track title (optional but helpful for context)
- **Genre**: Select from House, Techno, Pop, Hip Hop, etc.
- **Tempo**: BPM (60-200, defaults to 128)
- **Length**: Number of bars (16-256, defaults to 128)

#### 2. Add Patterns
Choose one of two methods:

**Option A: Type Patterns Manually**
1. Click **"Type in Patterns"**
2. Enter pattern names using these conventions:
   - `kick - 4x` (four-on-the-floor kick pattern)
   - `hi-hat - offbeat` (off-beat hi-hat pattern)
   - `bassline - chords` (chord-following bassline)
   - `synth - melody` (melodic synth line)
   - `vox sample` (vocal sample)

**Option B: Upload DAW Screenshot**
1. Click **"DAW Screenshot"**
2. Upload image of your DAW's track list
3. AI will extract track names automatically

#### 3. Select Sections
Choose which song sections you want:
- **Intro**: Opening section
- **Verse**: Main verse sections  
- **Chorus**: Chorus/hook sections
- **Bridge**: Contrasting bridge section
- **Build-up**: Energy building section
- **Drop**: High-energy section (EDM)
- **Outro**: Ending section

#### 4. Set Creativity Level
Adjust the creativity slider (1-5):
- **1 (Traditional)**: Conservative, genre-standard arrangements
- **3 (Balanced)**: Mix of traditional and modern elements
- **5 (Experimental)**: Innovative, unconventional arrangements

#### 5. Generate
Click **"Make Arrangement"** and wait for AI generation (usually 10-30 seconds).

### Understanding Your Arrangement

#### Visual Layout
Your arrangement appears as a **grid timeline**:

```
Instruments    | Bars →
kick - 4x      | ████ ░░░░ ████ ████
hi-hat - offbeat| ░░██ ████ ████ ░░██
bassline - chords| ░░░░ ████ ████ ░░░░
synth - melody | ░░░░ ░░██ ████ ░░░░
```

- **Rows**: Each instrument/pattern
- **Columns**: Bars in your song
- **Filled Blocks**: When instrument plays
- **Empty Blocks**: When instrument is silent
- **Colors**: Each instrument has unique color
- **Numbers**: Bar numbers at top

#### Reading the Grid
- **Section Labels**: Shows song structure (Intro, Verse, etc.)
- **Pattern Density**: More filled blocks = busier sections
- **Layering**: Multiple instruments playing = denser arrangement
- **Dynamics**: Empty spaces create contrast and breathing room

## Advanced Features

### Pattern Naming Conventions

Arreglo understands semantic pattern names. Use these formats for best results:

#### Rhythm Patterns
```
kick - 4x              # Steady four-on-the-floor
kick - syncopated      # Off-beat kick pattern
snare - backbeat       # Traditional snare on 2 and 4
hi-hat - 16th          # 16th note hi-hat pattern
hi-hat - offbeat       # Off-beat hi-hat emphasis
```

#### Bassline Patterns
```
bassline - root        # Simple root note bass
bassline - chords      # Follows chord progression
bassline - melody      # Melodic bassline
bassline - walking     # Walking bass style
bassline - buildup     # Ascending/building pattern
```

#### Melodic Patterns
```
synth - lead           # Lead synth melody
synth - chords         # Synth chord progression
synth - arp            # Arpeggiated pattern
synth - pad            # Sustained pad sounds
synth - stab           # Rhythmic chord stabs
```

#### Sample Patterns
```
vox sample             # Vocal sample
fx sample              # Sound effect sample
perc sample            # Percussion sample
crash sample           # Crash/impact sample
```

### Creativity Levels Explained

#### Level 1: Traditional
- Follows genre conventions strictly
- Predictable section lengths
- Standard instrument arrangements
- Safe, commercial sound

#### Level 2: Traditional Elements  
- Mostly conventional with some variation
- Slight pattern variations
- Genre-appropriate but with personality

#### Level 3: Balanced
- Mix of traditional and modern elements
- Creative pattern placements
- Good for contemporary productions

#### Level 4: Creative
- Innovative arrangements
- Unexpected pattern combinations
- Modern production techniques
- Takes risks while staying musical

#### Level 5: Experimental
- Highly unconventional arrangements
- Surprising pattern combinations
- Avant-garde approach
- May challenge genre boundaries

### Genre-Specific Tips

#### Electronic Music (House, Techno, Trance)
- Use `kick - 4x` for steady rhythm foundation
- Add `hi-hat - offbeat` for groove
- Include `bassline - chords` for harmonic movement
- Try `synth - buildup` before drops

#### Hip Hop / R&B
- Focus on `kick - syncopated` and `snare - backbeat`
- Use `bassline - root` for solid foundation
- Add `sample` patterns for character
- Include `hi-hat - 16th` for modern feel

#### Pop / Rock
- Start with `kick - 4x` and `snare - backbeat`
- Use `bassline - chords` for harmonic support
- Add `guitar - rhythm` and `guitar - lead`
- Include vocal patterns for hooks

## Troubleshooting

### Common Issues

#### "No arrangements generated"
- **Check API Keys**: Ensure valid API key is configured
- **Check Internet**: Plugin requires internet connection
- **Try Simpler Input**: Start with fewer patterns
- **Check Pattern Names**: Use recognized naming conventions

#### "Arrangement looks wrong"
- **Adjust Creativity**: Lower creativity for more predictable results
- **Check Genre**: Ensure genre matches your style
- **Review Patterns**: Verify pattern names are clear
- **Try Different Sections**: Some section combinations work better

#### "Plugin won't load"
- **Update Figma**: Ensure latest Figma version
- **Restart Figma**: Close and reopen Figma
- **Clear Cache**: Clear browser cache (web version)
- **Reinstall Plugin**: Remove and reinstall from Community Store

### Best Practices

#### Pattern Naming
- **Be Descriptive**: "kick - 4x" vs just "kick"
- **Use Conventions**: Follow the semantic patterns above
- **Stay Consistent**: Use similar naming across patterns
- **Avoid Ambiguity**: "synth1" vs "synth - lead"

#### Section Selection
- **Start Simple**: Begin with Intro, Verse, Chorus, Outro
- **Match Genre**: Electronic = Intro/Buildup/Drop, Pop = Verse/Chorus/Bridge
- **Consider Flow**: Think about energy progression
- **Use Variety**: Different sections create interest

#### Creativity Settings
- **Start Conservative**: Begin with level 2-3, adjust up if needed
- **Match Project Phase**: High creativity for sketching, lower for final arrangements
- **Genre Matters**: Electronic music can handle higher creativity than acoustic genres

## Tips for Better Results

### Pattern Strategy
1. **Foundation First**: Start with rhythm section (kick, snare, hi-hat)
2. **Add Harmony**: Include bass and chord instruments
3. **Layer Melody**: Add lead and melodic elements
4. **Texture Last**: Include samples, effects, and ear candy

### Arrangement Thinking
1. **Energy Arc**: Plan how energy builds and releases
2. **Contrast**: Mix busy and sparse sections
3. **Repetition vs Variation**: Balance familiarity with surprise
4. **Genre Awareness**: Understand your genre's typical structures

### Workflow Tips
1. **Iterate**: Generate multiple arrangements and compare
2. **Start Broad**: Get the big picture before details
3. **Export Plans**: Use arrangements as guides for actual production
4. **Learn Patterns**: Notice what works and adapt to your style

## Next Steps

### After Creating Arrangements
1. **Screenshot**: Save arrangements for reference
2. **Plan Production**: Use as blueprint for actual music creation
3. **Adapt as Needed**: Arrangements are starting points, not rules
4. **Share Results**: Show completed tracks to help improve the plugin

### Advanced Usage
1. **Multiple Versions**: Generate several arrangements for one song
2. **Genre Fusion**: Combine elements from different genre arrangements
3. **Section Focus**: Generate arrangements for specific song sections only
4. **Collaboration**: Share arrangements with band members or collaborators

### Community
- **Share Feedback**: Help improve the plugin with suggestions
- **Report Issues**: Let developers know about problems
- **Request Features**: Suggest new capabilities
- **Join Beta**: Sign up for new features like the VST plugin

---

*For technical issues or feature requests, contact the development team or visit the project documentation.* 