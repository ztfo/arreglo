import { getConfig, setConfig } from './core/config';
import { generateArrangement } from './core/api';
import { parseArrangement } from './core/utils';
import { ApiConfig, SongData, ArrangementData } from './core/types';
import { createArrangementPrompt } from './core/prompts';

figma.showUI(__html__, { 
    width: 500, 
    height: 600,
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

function createGrid(totalBars: number) {
    const gridFrame = figma.createFrame();
    gridFrame.name = "Arrangement Grid";
    gridFrame.layoutMode = "HORIZONTAL";
    gridFrame.itemSpacing = 2;
    gridFrame.paddingLeft = 16;
    gridFrame.paddingRight = 16;
    gridFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }];

    // Create bar markers
    for (let i = 0; i < totalBars; i++) {
        const bar = figma.createRectangle();
        bar.name = `Bar ${i + 1}`;
        bar.resize(10, 10);
        bar.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        gridFrame.appendChild(bar);
    }

    return gridFrame;
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
        mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Create title section
        const titleFrame = figma.createFrame();
        titleFrame.layoutMode = "HORIZONTAL";
        titleFrame.fills = [];
        titleFrame.name = "Title Section";
        titleFrame.primaryAxisSizingMode = "AUTO";
        titleFrame.counterAxisSizingMode = "AUTO";
        titleFrame.layoutAlign = "STRETCH";
        titleFrame.primaryAxisAlignItems = "CENTER";

        const titleText = figma.createText();
        titleText.characters = arrangement.title || "Song Arrangement";
        titleText.fontSize = 24;
        titleText.fontName = { family: "Inter", style: "Bold" };
        titleFrame.appendChild(titleText);
        mainFrame.appendChild(titleFrame);

        // Create grid container
        const gridContainer = figma.createFrame();
        gridContainer.name = "Grid Container";
        gridContainer.layoutMode = "HORIZONTAL";
        gridContainer.counterAxisSizingMode = "AUTO";
        gridContainer.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        gridContainer.cornerRadius = 12;
        gridContainer.paddingTop = 24;
        gridContainer.paddingBottom = 24;
        gridContainer.paddingLeft = 24;
        gridContainer.paddingRight = 24;
        gridContainer.counterAxisSizingMode = "AUTO";

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
        instruments.forEach(instrument => {
            const instrumentFrame = figma.createFrame();
            instrumentFrame.name = instrument;
            instrumentFrame.layoutMode = "HORIZONTAL";
            instrumentFrame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            instrumentFrame.primaryAxisAlignItems = "CENTER";
            instrumentFrame.counterAxisAlignItems = "CENTER";
            instrumentFrame.resize(columnWidth, 50);

            const label = figma.createText();
            label.characters = instrument;
            label.fontSize = 14;
            label.fontName = { family: "Inter", style: "Medium" };
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

        // Create patterns container
        const patternsContainer = figma.createFrame();
        patternsContainer.name = "Patterns Container";
        patternsContainer.layoutMode = "NONE";
        patternsContainer.itemSpacing = 0;
        patternsContainer.fills = [];
        patternsContainer.counterAxisSizingMode = "AUTO";
        patternsContainer.resize(totalBars * 50, instruments.length * 50);

        // Create grid lines
        const gridLines = figma.createFrame();
        gridLines.name = "Grid Lines";
        gridLines.layoutMode = "NONE";
        gridLines.fills = [];
        gridLines.resize(totalBars * 50, instruments.length * 50);
        gridLines.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
        gridLines.x = 0;
        gridLines.y = 0;

        // Vertical lines for each bar
        for (let i = 0; i <= totalBars; i++) {
            const line = figma.createLine();
            line.name = `Bar ${i + 1} Line`;
            line.strokeWeight = i % 4 === 0 ? 1 : 0.5; // Thicker lines every 4 bars
            line.strokeCap = "NONE";
            line.strokes = [{ 
                type: 'SOLID', 
                color: { 
                    r: 0.9, 
                    g: 0.9, 
                    b: 0.9 
                },
                opacity: i % 4 === 0 ? 1 : 0.5 // More visible lines every 4 bars
            }];
            line.x = i * 50;
            line.rotation = 90;
            line.resize(instruments.length * 50, 0);
            gridLines.appendChild(line);
        }

        // Horizontal lines between instruments
        for (let i = 0; i <= instruments.length; i++) {
            const line = figma.createLine();
            line.strokeWeight = 1;
            line.strokeCap = "NONE";
            line.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            line.y = i * 50;
            line.resize(totalBars * 50, 0);
            gridLines.appendChild(line);
        }

        // Set patterns container to absolute positioning
        patternsContainer.layoutMode = "NONE";
        patternsContainer.x = 0;
        patternsContainer.y = 0;

        // Create bar numbers (showing every 4th bar)
        const barNumbersFrame = figma.createFrame();
        barNumbersFrame.name = "Bar Numbers";
        barNumbersFrame.layoutMode = "HORIZONTAL";
        barNumbersFrame.itemSpacing = 0;
        barNumbersFrame.fills = [];
        barNumbersFrame.counterAxisSizingMode = "AUTO";
        barNumbersFrame.resize(totalBars * 50, 32);

        for (let i = 0; i < totalBars; i++) {
            const barNumberContainer = figma.createFrame();
            barNumberContainer.name = `Bar ${i + 1} Container`;
            barNumberContainer.resize(50, 32);
            barNumberContainer.fills = [];
            barNumberContainer.layoutMode = "HORIZONTAL";
            barNumberContainer.primaryAxisAlignItems = "CENTER";
            barNumberContainer.counterAxisAlignItems = "CENTER";

            // Only show number for every 4th bar
            if ((i + 1) % 4 === 0) {
                const barNumber = figma.createText();
                barNumber.characters = (i + 1).toString();
                barNumber.fontSize = 12;
                barNumber.fontName = { family: "Inter", style: "Regular" };
                barNumber.textAlignHorizontal = "CENTER";
                barNumberContainer.appendChild(barNumber);
            }

            barNumbersFrame.appendChild(barNumberContainer);
        }

        // Add grid lines first (will be underneath)
        patternsContainer.appendChild(gridLines);

        // Now add pattern rows with absolute positioning
        instruments.forEach((instrument, instrumentIndex) => {
            const row = figma.createFrame();
            row.name = `${instrument} Row`;
            row.layoutMode = "HORIZONTAL";
            row.itemSpacing = 0;
            row.fills = [];
            row.resize(totalBars * 50, 50);
            row.x = 0;
            row.y = instrumentIndex * 50; // Position each row absolutely

            let currentBar = 0;
            arrangement.sections.forEach(section => {
                const activeBars = section.instruments[instrument];
                
                // Create bars for this section
                for (let i = 0; i < section.duration; i++) {
                    const barBlock = figma.createRectangle();
                    barBlock.name = `Bar ${currentBar + i + 1}`;
                    barBlock.x = (currentBar + i) * 50;
                    barBlock.resize(48, 48); // Slightly smaller to show grid
                    barBlock.y = 1; // Center in the row
                    
                    // Check if this bar is active
                    const isActive = activeBars && activeBars.includes(i + 1);
                    barBlock.fills = [{ 
                        type: 'SOLID', 
                        color: getColorForInstrument(instrument, instrumentIndex),
                        opacity: isActive ? 1 : 0.1 // Full opacity for active bars, faint for inactive
                    }];
                    
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
        contentContainer.itemSpacing = 16;
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

figma.ui.onmessage = async (msg) => {
    try {
        if (msg.type === 'load-settings') {
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
                songData.genre,
                undefined, // style is optional
                songData.selectedSections,
                songData.patterns.map(p => p.name),
                songData.creativity
            );

            const response = await generateArrangement(config, prompt);
            const arrangement = parseArrangement(response, songData.title);
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