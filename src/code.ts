import { getConfig, setConfig } from './core/config';
import { generateArrangement } from './core/api';
import { parseArrangement } from './core/utils';
import { ApiConfig, SongData, ArrangementData } from './core/types';
import { createArrangementPrompt } from './core/prompts';

figma.showUI(__html__, { 
    width: 700, 
    height: 660,
    themeColors: true 
});

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

function getColorForInstrument(instrument: string, instrumentIndex: number): { r: number, g: number, b: number } {
    return BASE_COLORS[instrumentIndex % BASE_COLORS.length];
}

function createPatternBlock(instrument: string, pattern: string, instrumentIndex: number) {
    const block = figma.createFrame();
    block.name = `${instrument} Pattern`;
    block.layoutMode = "VERTICAL";
    block.counterAxisSizingMode = "AUTO";
    block.fills = [{ type: 'SOLID', color: getColorForInstrument(instrument, instrumentIndex) }];
    block.cornerRadius = 8;
    block.paddingTop = 16;
    block.paddingBottom = 16;
    block.paddingLeft = 16;
    block.paddingRight = 16;

    const label = figma.createText();
    label.characters = instrument;
    label.fontSize = 16;
    label.fontName = { family: "Inter", style: "Medium" };
    label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text

    const patternText = figma.createText();
    patternText.characters = pattern;
    patternText.fontSize = 14;
    patternText.fontName = { family: "Inter", style: "Regular" };
    patternText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text

    block.appendChild(label);
    block.appendChild(patternText);
    return block;
}

function createInstrumentTrack(instrument: string, pattern: string, startBar: number, duration: number, trackHeight: number, instrumentIndex: number) {
    const track = figma.createRectangle();
    track.name = `${instrument} Track`;
    track.x = startBar * 12; 
    track.resize(duration * 12 - 2, trackHeight);
    track.fills = [{ 
        type: 'SOLID', 
        color: getColorForInstrument(instrument, instrumentIndex)
    }];
    track.cornerRadius = 4;

    const label = figma.createText();
    label.characters = instrument;
    label.fontSize = 12;
    label.fontName = { family: "Inter", style: "Medium" };
    label.textAlignHorizontal = "CENTER";
    label.textAlignVertical = "CENTER";
    label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    label.x = track.x + (track.width - label.width) / 2;
    label.y = track.y + (trackHeight - label.height) / 2;

    return [track, label];
}

async function createVisualArrangement(arrangement: ArrangementData) {
    try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });

        // Create main container
        const mainFrame = figma.createFrame();
        mainFrame.name = arrangement.title || "Song Arrangement";
        mainFrame.layoutMode = "VERTICAL";
        mainFrame.itemSpacing = 24;
        mainFrame.paddingTop = 32;
        mainFrame.paddingBottom = 32;
        mainFrame.paddingLeft = 32;
        mainFrame.paddingRight = 32;
        mainFrame.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; 
  
        mainFrame.strokes = [{
            type: 'SOLID',
            color: { r: 0.047, g: 0.047, b: 0.047 } // #0c0c0c
        }];
        mainFrame.strokeWeight = 2;

        // Create title section
        const titleFrame = figma.createFrame();
        titleFrame.layoutMode = "HORIZONTAL";
        titleFrame.fills = [];
        titleFrame.name = "Title Section";
        titleFrame.primaryAxisSizingMode = "AUTO";
        titleFrame.counterAxisSizingMode = "AUTO";
        titleFrame.layoutAlign = "STRETCH";
        titleFrame.primaryAxisAlignItems = "CENTER";

        // Create Arreglo logo frame
        const arregloLogoFrame = figma.createFrame();
        arregloLogoFrame.name = "Arreglo Logo";
        arregloLogoFrame.resize(120, 32);
        arregloLogoFrame.fills = [];

        // Create the logo mark (square with A)
        const logoMark = figma.createFrame();
        logoMark.name = "Logo Mark";
        logoMark.resize(32, 32);
        logoMark.fills = [];

        // Create the outer square
        const outerSquare = figma.createRectangle();
        outerSquare.name = "Outer Square";
        outerSquare.resize(32, 32);
        outerSquare.fills = [];
        outerSquare.strokes = [{
            type: 'SOLID',
            color: { r: 0.906, g: 0.831, b: 0.580 } // #E7D494
        }];
        outerSquare.strokeWeight = 3;

        // Create the "A" shape using vector
        const aShape = figma.createVector();
        aShape.name = "A Shape";
        const aPath = "M6 9L23 9L23 23H9V14L20 14V11L6 11L6 26L26 26L26 6L6 6V9Z";
        aShape.setVectorNetworkAsync({
            vertices: [
                { x: 6, y: 9 }, { x: 23, y: 9 }, { x: 23, y: 23 }, { x: 9, y: 23 },
                { x: 9, y: 14 }, { x: 20, y: 14 }, { x: 20, y: 11 }, { x: 6, y: 11 },
                { x: 6, y: 26 }, { x: 26, y: 26 }, { x: 26, y: 6 }, { x: 6, y: 6 }
            ],
            segments: [
                { start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 },
                { start: 3, end: 4 }, { start: 4, end: 5 }, { start: 5, end: 6 },
                { start: 6, end: 7 }, { start: 7, end: 8 }, { start: 8, end: 9 },
                { start: 9, end: 10 }, { start: 10, end: 11 }, { start: 11, end: 0 }
            ]
        });
        aShape.fills = [{
            type: 'SOLID',
            color: { r: 0.906, g: 0.831, b: 0.580 } // #E7D494
        }];
        aShape.strokes = [];

        // Create the middle line of the A
        const middleLine = figma.createRectangle();
        middleLine.name = "Middle Line";
        middleLine.resize(9, 3);
        middleLine.x = 11;
        middleLine.y = 17;
        middleLine.fills = [{
            type: 'SOLID',
            color: { r: 0.906, g: 0.831, b: 0.580 } // #E7D494
        }];

        // Create the "made with" text
        const madeWithText = figma.createText();
        madeWithText.characters = "made with";
        madeWithText.fontSize = 8;
        madeWithText.x = 40;
        madeWithText.y = 0;
        madeWithText.fontName = { family: "Inter", style: "Regular" };
        madeWithText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Assemble the logo mark
        logoMark.appendChild(outerSquare);
        logoMark.appendChild(aShape);
        logoMark.appendChild(middleLine);

        // Create the wordmark
        const wordmark = figma.createText();
        wordmark.characters = "arreglo.";
        wordmark.fontSize = 20;
        wordmark.x = 40;
        wordmark.y = 6;
        wordmark.fontName = { family: "Inter", style: "Bold" };
        wordmark.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Assemble the logo
        arregloLogoFrame.appendChild(logoMark);
        arregloLogoFrame.appendChild(madeWithText);
        arregloLogoFrame.appendChild(wordmark);
        titleFrame.appendChild(arregloLogoFrame);
        mainFrame.appendChild(titleFrame);

        // Create grid container
        const gridContainer = figma.createFrame();
        gridContainer.name = "Grid Container";
        gridContainer.layoutMode = "HORIZONTAL";
        gridContainer.counterAxisSizingMode = "AUTO";
        gridContainer.fills = [{ type: 'SOLID', color: { r: 0.047, g: 0.047, b: 0.047 } }]; // #0c0c0c
        gridContainer.cornerRadius = 12;
        gridContainer.paddingTop = 24;
        gridContainer.paddingBottom = 24;
        gridContainer.paddingLeft = 24;
        gridContainer.paddingRight = 24;
        gridContainer.counterAxisSizingMode = "AUTO";
        // Remove border
        gridContainer.strokes = [];

        // Create instruments column
        const instrumentsColumn = figma.createFrame();
        instrumentsColumn.name = "Instruments";
        instrumentsColumn.layoutMode = "VERTICAL";
        instrumentsColumn.itemSpacing = 12;
        instrumentsColumn.fills = [];
        instrumentsColumn.minWidth = 160;
        instrumentsColumn.maxWidth = 280;
        instrumentsColumn.counterAxisSizingMode = "AUTO";
        instrumentsColumn.primaryAxisSizingMode = "AUTO";
        const columnWidth = 160;
        instrumentsColumn.resize(columnWidth, instrumentsColumn.height);

        // Add spacer frame to align with bar numbers
        const spacerFrame = figma.createFrame();
        spacerFrame.name = "Spacer";
        spacerFrame.layoutMode = "HORIZONTAL";
        spacerFrame.resize(columnWidth, 32);
        spacerFrame.fills = [];
        spacerFrame.primaryAxisAlignItems = "MAX";
        spacerFrame.counterAxisAlignItems = "CENTER";
        spacerFrame.paddingRight = 16;

        // Add song title to spacer frame
        const titleText = figma.createText();
        titleText.characters = arrangement.title || "Song Arrangement";
        titleText.fontSize = 14;
        titleText.fontName = { family: "Inter", style: "Medium" };
        titleText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text
        titleText.textAlignHorizontal = "RIGHT";
        spacerFrame.appendChild(titleText);
        instrumentsColumn.appendChild(spacerFrame);

        // Create instruments grid container
        const instrumentsGridContainer = figma.createFrame();
        instrumentsGridContainer.name = "Instruments Grid";
        instrumentsGridContainer.layoutMode = "VERTICAL";
        instrumentsGridContainer.itemSpacing = 0;
        instrumentsGridContainer.fills = [];
        instrumentsGridContainer.counterAxisSizingMode = "AUTO";
        instrumentsGridContainer.resize(columnWidth, instrumentsGridContainer.height);

        // Get unique instruments
        const instruments = Array.from(new Set(
            arrangement.sections.flatMap(section => Object.keys(section.instruments))
        ));

        // Create instrument labels
        instruments.forEach((instrument, instrumentIndex) => {
            const instrumentFrame = figma.createFrame();
            instrumentFrame.name = instrument;
            instrumentFrame.layoutMode = "HORIZONTAL";
            instrumentFrame.fills = [{ type: 'SOLID', color: { r: 0.012, g: 0.012, b: 0.012 } }]; // #030303
            instrumentFrame.primaryAxisAlignItems = "MAX";
            instrumentFrame.counterAxisAlignItems = "CENTER";
            instrumentFrame.resize(columnWidth, 50);
            instrumentFrame.paddingLeft = 16;
            instrumentFrame.paddingRight = 16;

            // Add border radius to first and last instrument frames
            if (instrumentIndex === 0) {
                instrumentFrame.topLeftRadius = 16;
            } else if (instrumentIndex === instruments.length - 1) {
                instrumentFrame.bottomLeftRadius = 16;
            }

            const label = figma.createText();
            label.characters = instrument;
            label.fontSize = 14;
            label.fontName = { family: "Inter", style: "Medium" };
            label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            label.textAlignHorizontal = "RIGHT";
            instrumentFrame.appendChild(label);
            instrumentsGridContainer.appendChild(instrumentFrame);
        });

        instrumentsColumn.appendChild(instrumentsGridContainer);

        // Create bars grid
        const totalBars = arrangement.sections.reduce((total, section) => total + section.duration, 0);
        const barsContainer = figma.createFrame();
        barsContainer.name = "Bars Container";
        barsContainer.layoutMode = "VERTICAL";
        barsContainer.itemSpacing = 12;
        barsContainer.fills = [];
        barsContainer.counterAxisSizingMode = "AUTO";
        barsContainer.resize(totalBars * 50, barsContainer.height);
        barsContainer.strokes = [];
        barsContainer.paddingTop = 0;
        barsContainer.paddingBottom = 0;
        barsContainer.paddingLeft = 0;
        barsContainer.paddingRight = 0;

        // Create patterns container
        const patternsContainer = figma.createFrame();
        patternsContainer.name = "Patterns Container";
        patternsContainer.layoutMode = "NONE";
        patternsContainer.itemSpacing = 0;
        patternsContainer.fills = [];
        patternsContainer.counterAxisSizingMode = "AUTO";
        patternsContainer.resize(totalBars * 50, instruments.length * 50);

        // Create bar numbers frame
        const barNumbersFrame = figma.createFrame();
        barNumbersFrame.name = "Bar Numbers";
        barNumbersFrame.layoutMode = "HORIZONTAL";
        barNumbersFrame.itemSpacing = 0;
        barNumbersFrame.fills = [];
        barNumbersFrame.resize(totalBars * 50, 32);

        for (let i = 0; i < totalBars; i++) {
            const barNumberContainer = figma.createFrame();
            barNumberContainer.name = `Bar ${i + 1} Container`;
            barNumberContainer.layoutMode = "NONE";
            barNumberContainer.fills = [];
            barNumberContainer.resize(48, 32);
            barNumberContainer.x = i * 50;
            barNumberContainer.y = 0;

            const barNumber = figma.createText();
            barNumber.characters = (i + 1).toString();
            barNumber.fontSize = 10;
            barNumber.fontName = { family: "Inter", style: "Regular" };
            barNumber.textAlignHorizontal = "LEFT";
            barNumber.fills = [{ type: 'SOLID', color: { r: 0.906, g: 0.831, b: 0.580 } }];
            barNumber.x = 1;
            barNumber.y = (32 - barNumber.height) / 2;
            barNumberContainer.appendChild(barNumber);

            barNumbersFrame.appendChild(barNumberContainer);
        }

        // Set patterns container to absolute positioning
        patternsContainer.layoutMode = "NONE";
        patternsContainer.x = 0;
        patternsContainer.y = 0;

        // Now add pattern rows with absolute positioning
        instruments.forEach((instrument, instrumentIndex) => {
            const row = figma.createFrame();
            row.name = `${instrument} Row`;
            row.layoutMode = "HORIZONTAL";
            row.itemSpacing = 0;
            row.fills = [];
            row.resize(totalBars * 50, 50);
            row.x = 0;
            row.y = instrumentIndex * 50;

            let currentBar = 0;
            arrangement.sections.forEach(section => {
                const activeBars = section.instruments[instrument];
                
                // Create bars for this section
                for (let i = 0; i < section.duration; i++) {
                    const barBlock = figma.createFrame();
                    barBlock.name = `Bar ${currentBar + i + 1}`;
                    barBlock.x = (currentBar + i) * 50 + 1;
                    barBlock.resize(48, 48);
                    barBlock.y = 1;
                    barBlock.layoutMode = "HORIZONTAL";
                    barBlock.itemSpacing = 0;
                    barBlock.fills = [{ 
                        type: 'SOLID', 
                        color: getColorForInstrument(instrument, instrumentIndex),
                        opacity: activeBars && activeBars.includes(i + 1) ? 1 : 0.1
                    }];
                    barBlock.strokes = [{
                        type: 'SOLID',
                        color: { r: 0, g: 0, b: 0 }, // Pure black
                        opacity: 1
                    }];
                    barBlock.strokeRightWeight = 2;
                    barBlock.strokeTopWeight = 0;
                    barBlock.strokeBottomWeight = 0;
                    barBlock.strokeLeftWeight = 0;

                    // Add beat division indicators
                    for (let beat = 0; beat < 4; beat++) {
                        const beatBlock = figma.createRectangle();
                        beatBlock.name = `Beat ${beat + 1}`;
                        beatBlock.resize(12, 48);
                        beatBlock.fills = [{ 
                            type: 'SOLID', 
                            color: { r: 1, g: 1, b: 1 },
                            opacity: beat % 2 === 0 ? 0.1 : 0.05
                        }];
                        barBlock.appendChild(beatBlock);
                    }
                    
                    row.appendChild(barBlock);
                }
                
                currentBar += section.duration;
            });

            patternsContainer.appendChild(row);
        });

        // Add both frames to bars container in correct order
        barsContainer.appendChild(barNumbersFrame);
        barsContainer.appendChild(patternsContainer);

        // Assemble the layout
        const contentContainer = figma.createFrame();
        contentContainer.name = "Content Container";
        contentContainer.layoutMode = "HORIZONTAL";
        contentContainer.itemSpacing = 0; // Removed 16px spacing
        contentContainer.fills = [];
        contentContainer.counterAxisSizingMode = "AUTO";
        contentContainer.appendChild(instrumentsColumn);
        contentContainer.appendChild(barsContainer);

        gridContainer.appendChild(contentContainer);
        mainFrame.appendChild(gridContainer);

        // Position the main frame
        mainFrame.resize(
            Math.max(800, totalBars * 50 + 200), // Minimum width of 800px
            mainFrame.height
        );
        mainFrame.x = figma.viewport.center.x - mainFrame.width / 2;
        mainFrame.y = figma.viewport.center.y - mainFrame.height / 2;

        figma.currentPage.appendChild(mainFrame);
        figma.viewport.scrollAndZoomIntoView([mainFrame]);

    } catch (error: unknown) {
        console.error('Error in createVisualArrangement:', error);
        const errorMessage = (error as Error).message || 'Failed to create arrangement.';
        figma.ui.postMessage({ type: 'error', message: errorMessage });
        throw error;
    }
}

async function validateConfig(config: ApiConfig): Promise<boolean> {
    return config.OPENAI_API_KEY !== '' || config.ANTHROPIC_API_KEY !== '';
}

async function analyzeImage(imageBase64: string): Promise<string[]> {
    const config = await getConfig();
    
    if (!config.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please analyze this DAW screenshot and extract all track/instrument names. Return them as a comma-separated list."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Failed to analyze image: ${response.statusText}${errorData ? ' - ' + JSON.stringify(errorData) : ''}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    return extractedText.split(',').map((name: string) => name.trim());
}

const TEST_ARRANGEMENT_RESPONSE = `---

SECTION: Intro  
DURATION: 8  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: hi-hat - offbeat  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: vox sample  
BARS: 4,8  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Verse 1  
DURATION: 16  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16  
END_INSTRUMENT  
INSTRUMENT: bassline - chords  
BARS: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16  
END_INSTRUMENT  
INSTRUMENT: hi-hat - offbeat  
BARS: 5,6,7,8,13,14,15,16  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Chorus 1  
DURATION: 8  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: bassline - melody  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: lead synth - chords  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: vox sample  
BARS: 4,8  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Verse 2  
DURATION: 16  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16  
END_INSTRUMENT  
INSTRUMENT: bassline - chords  
BARS: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16  
END_INSTRUMENT  
INSTRUMENT: hi-hat - offbeat  
BARS: 5,6,7,8,13,14,15,16  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Chorus 2  
DURATION: 8  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: bassline - melody  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: lead synth - chords  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: vox sample  
BARS: 4,8  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Bridge  
DURATION: 8  
INSTRUMENT: saxophone - solo  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: bassline - chords  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: hi-hat - offbeat  
BARS: 5,6,7,8  
END_INSTRUMENT  
END_SECTION  

---

SECTION: Build-up  
DURATION: 8  
INSTRUMENT: kick - 4x  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: bassline - melody  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: lead synth - chords  
BARS: 5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: hi-hat - offbeat  
BARS: 1,2,3,4,5,6,7,8  
END_INSTRUMENT  
INSTRUMENT: vox sample  
BARS: 8  
END_INSTRUMENT  
END_SECTION  

---`;

figma.ui.onmessage = async (msg) => {
    try {
        if (msg.type === 'test-arrangement') {
            const arrangement = parseArrangement(TEST_ARRANGEMENT_RESPONSE, "Test Song");
            await createVisualArrangement(arrangement);
            figma.ui.postMessage({ type: 'success', message: 'Test arrangement created!' });
        } else if (msg.type === 'load-settings') {
            const config = await getConfig();
            figma.ui.postMessage({ type: 'settings-loaded', config });
        } else if (msg.type === 'save-settings') {
            await setConfig(msg.config);
            figma.ui.postMessage({ type: 'settings-saved' });
        } else if (msg.type === 'analyze-image') {
            const config = await getConfig();
            if (!config.OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured');
            }
            const trackNames = await analyzeImage(msg.base64Image);
            figma.ui.postMessage({ 
                type: 'image-analyzed',
                trackNames
            });
        } else if (msg.type === 'generate-arrangement') {
            const config = await getConfig();
            if (!await validateConfig(config)) {
                throw new Error('Please configure at least one API key in settings first!');
            }

            const songData = msg.songData as SongData;
            const prompt = createArrangementPrompt(
                songData.title,
                songData.length,
                songData.genre,
                undefined,
                songData.selectedSections,
                songData.patterns.map(p => p.name),
                songData.creativity
            );

            const response = await generateArrangement(config, prompt);
            const arrangement = parseArrangement(response, songData.title, songData.length);
            await createVisualArrangement(arrangement);
            figma.ui.postMessage({ type: 'success', message: 'Arrangement created!' });
        }
    } catch (error: unknown) {
        console.error('Plugin error:', error);
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        figma.ui.postMessage({ 
            type: 'error', 
            message: errorMessage 
        });
    }
};