## Arreglo - Figma Plugin

Arreglo is a Figma plugin that helps music producers visualize song arrangements. Using AI, it generates and visualizes song structures based on your input, making it easy to plan and understand song arrangements.

### Main Interface

<div align="center">
  <img src="images/ui-mocks/arreglo-main.png" alt="Main plugin interface">
  <p>Create arrangements by setting song details, adding patterns, and selecting sections.</p>
</div>

### Features

- **AI-Generated Arrangements**: Get complete song arrangements based on your inputs
- **Visual Grid Layout**: See exactly when each instrument plays throughout the song
- **Section-Based Structure**: Choose from various song sections (Intro, Verse, Chorus, Bridge, Build-up, Drop, Outro)
- **Instrument Pattern Management**:
  - Manually add custom patterns
  - Upload DAW screenshots to automatically extract track names using AI
  - View and edit patterns in real-time
- **Customization Options**:
  - Adjustable song length (16-256 bars)
  - Tempo control (60-200 BPM)
  - Creativity slider to control arrangement style (Traditional to Experimental)
  - Multiple genre options (House, Techno, Trance, DnB, Pop, Rock, Jazz, etc.)

### Usage

1. Install and Run:
   * Open Figma
   * Run the "Arreglo" plugin

2. Configure (First Time Setup):
   * Open settings (gear icon)
   * Add your OpenAI API key
   * Save settings

3. Create an Arrangement:
   * Enter a song title
   * Choose a genre
   * Set desired length and tempo
   * Add instrument patterns:
     - Type manually and click "Add Pattern", or
     - Upload a DAW screenshot to extract track names
   * Select desired song sections
   * Adjust creativity level
   * Click "Create Arrangement"

4. View Your Arrangement:
   * See a grid showing when each instrument plays
   * Each row represents an instrument
   * Colored cells show active bars for each instrument
   * Section labels show the structure of your song

### Requirements

- Figma Desktop App or Figma Web (in supported browsers)
- OpenAI or Anthropic API key for AI features

### Future Plans
- Sexy looking UI
- Sexier looking arrangements
- Export arrangements to JSON and MIDI
- DAW Trackname Extractions
- Integration with DAWs

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

### Demo Video

<div align="center">
  <a href="https://www.loom.com/share/226d00eb993b497b94f22806fbfcad95?sid=be561512-b089-493f-9ebd-a0cb17b9262c">
    <img src="images/video-thumb.png" alt="Watch the demo video">
  </a>
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