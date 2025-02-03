## Arreglo - Figma Plugin

Arreglo is a Figma plugin that helps music producers visualize song arrangements. Using AI with semantic pattern recognition, it generates musically intelligent arrangements based on your instrument patterns and track names, making it easy to plan and understand song structures.

### Main Interface

<div align="center">
  <img src="images/arreglo-main-screenshot.png" alt="Main plugin interface">
  <p>Create arrangements by setting song details, adding semantic patterns, and selecting sections.</p>
</div>

### Current Example Output

<div align="center">
  <img src="images/current-example.jpg" alt="Example of an Arreglo arrangement visualization">
  <p>This example shows a generated arrangement with:</p>
</div>

- Multiple sections (Intro, Verse, Chorus, Bridge, etc.)
- Custom instrument patterns
- Adjustable creativity levels
- Visual grid layout showing when each instrument plays

### Features

- **Intelligent AI Arrangement Generation**: 
  - Creates musically coherent arrangements based on semantic pattern descriptions
  - Understands different pattern types (e.g., "kick - 4x", "bassline - melody")
  - Intelligently places instruments based on their musical role
  - Balances musical conventions with creative freedom

- **Pattern Management**:
  - Add patterns with descriptive names (e.g., "hi-hat - offbeat", "bassline - buildup")
  - Extract track names automatically from DAW screenshots
  - Supports common pattern types: four-on-the-floor, chord progressions, melodies, buildups
  - Strategic placement of samples and featured instruments

- **Customization**:
  - Song length: 16-256 bars
  - Tempo: 60-200 BPM
  - Genre selection: House, Techno, Trance, DnB, Pop, Rock, Jazz, etc.
  - Creativity control: Traditional to Experimental
  - Time signature: 4/4 (common time)

### Usage

1. Install and Run:
   * Open Figma
   * Run the "Arreglo" plugin

2. Configure (First Time Setup):
   * Open settings (bottom left icon)
   * Add your preferred API key
   * Save settings

3. Create an Arrangement:
   * Enter a song title
   * Choose a genre
   * Set desired length and tempo
   * Add semantic patterns:
     - Use descriptive names (e.g., "kick - 4x", "bassline - melody")
     - Type manually and click "Add Pattern", or
     - Upload a DAW screenshot to extract track names
   * Select desired sections
   * Adjust creativity level
   * Click "Create Arrangement"

4. View Your Arrangement:
   * See a grid showing when each instrument plays
   * Each row represents an instrument with its specific pattern type
   * Colored cells show active bars based on musical context
   * Section labels show the structure of your song
   * Grid displays 4 beats per bar (4/4 time signature)

### Requirements

- Figma Desktop App or Figma Web (in supported browsers)
- OpenAI or Anthropic API key for AI features

### Future Plans
- Support for different time signatures (3/4, 6/8, etc.)
- Export arrangements to JSON and MIDI for DAW Import
- Direct DAW integration for pattern controls (FL Studio Playlist & Pattern Editor)
- Integration with other DAWs
- More granular pattern control (note density, swing, etc.)
- Custom time signature support with adjustable beat divisions
- Visual beat markers and swing grid options

### Additional Screens

#### Settings Panel
<div align="center">
  <img src="images/ui-mocks/arreglo-settings.png" alt="Settings configuration">
  <p>Configure your API keys and preferences.</p>
</div>

#### Loading State
<div align="center">
  <img src="images/ui-mocks/arreglo-loading.png" alt="Loading state">
  <p>Visual feedback while your arrangement is being generated.</p>
</div>

#### Success State
<div align="center">
  <img src="images/ui-mocks/arreglo-success.png" alt="Success message">
  <p>Confirmation when your arrangement is ready.</p>
</div>

#### Error Handling
<div align="center">
  <img src="images/ui-mocks/arreglo-error.png" alt="Error state">
  <p>Clear error messages if something goes wrong.</p>
</div>

### Early Prototype Demo Video

<div align="center">
  <a href="https://www.loom.com/share/226d00eb993b497b94f22806fbfcad95?sid=be561512-b089-493f-9ebd-a0cb17b9262c">
    <img src="images/video-thumb.png" alt="Watch the demo video">
  </a>
</div>