import { getConfig, setConfig } from './core/config';
import { generateArrangement } from './core/api';
import { parseArrangement } from './core/utils';
import { ApiConfig, SongData, ArrangementData } from './core/types';
import { createArrangementPrompt } from './core/prompts';

figma.showUI(__html__, { 
    width: 400, 
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
        mainFrame.itemSpacing = 16;
        mainFrame.paddingTop = 24;
        mainFrame.paddingBottom = 24;
        mainFrame.paddingLeft = 24;
        mainFrame.paddingRight = 24;
        mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Create title section
        const titleFrame = figma.createFrame();
        titleFrame.layoutMode = "HORIZONTAL";
        titleFrame.fills = [];
        titleFrame.name = "Title Section";

        const titleText = figma.createText();
        titleText.characters = arrangement.title || "Song Arrangement";
        titleText.fontSize = 20;
        titleText.fontName = { family: "Inter", style: "Bold" };
        titleFrame.appendChild(titleText);
        mainFrame.appendChild(titleFrame);

        // Create grid container
        const gridContainer = figma.createFrame();
        gridContainer.name = "Grid Container";
        gridContainer.layoutMode = "HORIZONTAL";
        gridContainer.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        gridContainer.cornerRadius = 8;
        gridContainer.paddingTop = 16;
        gridContainer.paddingBottom = 16;
        gridContainer.paddingLeft = 16;
        gridContainer.paddingRight = 16;

        // Create instruments column
        const instrumentsColumn = figma.createFrame();
        instrumentsColumn.name = "Instruments";
        instrumentsColumn.layoutMode = "VERTICAL";
        instrumentsColumn.itemSpacing = 8;
        instrumentsColumn.fills = [];

        const instrumentLabel = figma.createText();
        instrumentLabel.characters = "Instrument\nPatterns";
        instrumentLabel.fontSize = 14;
        instrumentLabel.fontName = { family: "Inter", style: "Medium" };
        instrumentLabel.textAlignHorizontal = "CENTER";
        instrumentsColumn.appendChild(instrumentLabel);

        // Get unique instruments
        const instruments = Array.from(new Set(
            arrangement.sections.flatMap(section => Object.keys(section.patterns))
        ));

        // Create instrument labels
        instruments.forEach(instrument => {
            const instrumentFrame = figma.createFrame();
            instrumentFrame.name = instrument;
            instrumentFrame.layoutMode = "VERTICAL";
            instrumentFrame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            instrumentFrame.cornerRadius = 4;
            instrumentFrame.paddingTop = 8;
            instrumentFrame.paddingBottom = 8;
            instrumentFrame.paddingLeft = 12;
            instrumentFrame.paddingRight = 12;

            const label = figma.createText();
            label.characters = instrument;
            label.fontSize = 14;
            label.fontName = { family: "Inter", style: "Medium" };
            instrumentFrame.appendChild(label);
            instrumentsColumn.appendChild(instrumentFrame);
        });

        gridContainer.appendChild(instrumentsColumn);

        // Create bars grid
        const totalBars = arrangement.sections.reduce((total, section) => total + section.duration, 0);
        const barsContainer = figma.createFrame();
        barsContainer.name = "Bars Container";
        barsContainer.layoutMode = "VERTICAL";
        barsContainer.itemSpacing = 8;
        barsContainer.fills = [];

        // Create bar numbers and grid lines
        const barNumbersFrame = figma.createFrame();
        barNumbersFrame.name = "Bar Numbers";
        barNumbersFrame.layoutMode = "HORIZONTAL";
        barNumbersFrame.itemSpacing = 0;
        barNumbersFrame.fills = [];
        barNumbersFrame.counterAxisSizingMode = "AUTO";

        // Create grid background
        const gridBackground = figma.createFrame();
        gridBackground.name = "Grid Background";
        gridBackground.layoutMode = "HORIZONTAL";
        gridBackground.itemSpacing = 0;
        gridBackground.fills = [];
        gridBackground.counterAxisSizingMode = "AUTO";

        for (let i = 1; i <= totalBars; i++) {
            // Create bar number
            const barNumberContainer = figma.createFrame();
            barNumberContainer.name = `Bar ${i} Container`;
            barNumberContainer.resize(40, 24);
            barNumberContainer.fills = [];
            barNumberContainer.layoutMode = "HORIZONTAL";
            barNumberContainer.primaryAxisAlignItems = "CENTER";
            barNumberContainer.counterAxisAlignItems = "CENTER";

            const barNumber = figma.createText();
            barNumber.characters = i.toString();
            barNumber.fontSize = 12;
            barNumber.fontName = { family: "Inter", style: "Regular" };
            barNumber.textAlignHorizontal = "CENTER";
            barNumberContainer.appendChild(barNumber);
            barNumbersFrame.appendChild(barNumberContainer);

            // Create grid column
            const gridColumn = figma.createFrame();
            gridColumn.name = `Bar ${i} Grid`;
            gridColumn.resize(40, 40 * (instruments.length + 1)); // +1 for the header
            gridColumn.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            if (i % 2 === 0) {
                gridColumn.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }];
            }
            
            // Add vertical grid line
            const verticalLine = figma.createLine();
            verticalLine.strokeWeight = 1;
            verticalLine.strokeCap = "NONE";
            verticalLine.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            verticalLine.x = gridColumn.width;
            verticalLine.y = 0;
            verticalLine.rotation = 90;
            verticalLine.resize(gridColumn.height, 0);
            gridColumn.appendChild(verticalLine);

            gridBackground.appendChild(gridColumn);
        }

        // Add horizontal grid lines
        for (let i = 0; i <= instruments.length; i++) {
            const horizontalLine = figma.createLine();
            horizontalLine.strokeWeight = 1;
            horizontalLine.strokeCap = "NONE";
            horizontalLine.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            horizontalLine.x = 0;
            horizontalLine.y = i * 40;
            horizontalLine.resize(totalBars * 40, 0);
            gridBackground.appendChild(horizontalLine);
        }

        barsContainer.appendChild(barNumbersFrame);
        barsContainer.appendChild(gridBackground);

        // Create pattern blocks for each instrument
        instruments.forEach((instrument, instrumentIndex) => {
            const patternRow = figma.createFrame();
            patternRow.name = `${instrument} Patterns`;
            patternRow.layoutMode = "HORIZONTAL";
            patternRow.itemSpacing = 0;
            patternRow.fills = [];
            patternRow.counterAxisSizingMode = "AUTO";

            let currentBar = 0;
            arrangement.sections.forEach(section => {
                if (section.patterns[instrument]) {
                    const pattern = figma.createFrame();
                    pattern.name = `${instrument} ${section.name}`;
                    pattern.resize(40 * section.duration, 40);
                    pattern.fills = [{ type: 'SOLID', color: getColorForInstrument(instrument, instrumentIndex) }];
                    pattern.cornerRadius = 4;
                    pattern.opacity = 0.9;

                    const patternText = figma.createText();
                    patternText.characters = section.patterns[instrument];
                    patternText.fontSize = 12;
                    patternText.fontName = { family: "Inter", style: "Regular" };
                    patternText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                    patternText.x = 8;
                    patternText.y = (40 - patternText.height) / 2;
                    pattern.appendChild(patternText);

                    patternRow.appendChild(pattern);
                } else {
                    // Create empty space if no pattern
                    const emptySpace = figma.createFrame();
                    emptySpace.resize(40 * section.duration, 40);
                    emptySpace.fills = [];
                    patternRow.appendChild(emptySpace);
                }
                currentBar += section.duration;
            });

            barsContainer.appendChild(patternRow);
        });

        gridContainer.appendChild(barsContainer);
        mainFrame.appendChild(gridContainer);

        // Create sections container
        const sectionsContainer = figma.createFrame();
        sectionsContainer.name = "Sections";
        sectionsContainer.layoutMode = "HORIZONTAL";
        sectionsContainer.itemSpacing = 2;
        sectionsContainer.fills = [];

        let currentBar = 0;
        arrangement.sections.forEach(section => {
            const sectionFrame = figma.createFrame();
            sectionFrame.name = section.name;
            sectionFrame.resize(40 * section.duration, 40);
            sectionFrame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            sectionFrame.cornerRadius = 4;

            const sectionText = figma.createText();
            sectionText.characters = section.name;
            sectionText.fontSize = 14;
            sectionText.fontName = { family: "Inter", style: "Medium" };
            sectionText.textAlignHorizontal = "CENTER";
            sectionText.x = (sectionFrame.width - sectionText.width) / 2;
            sectionText.y = (40 - sectionText.height) / 2;
            sectionFrame.appendChild(sectionText);

            sectionsContainer.appendChild(sectionFrame);
            currentBar += section.duration;
        });

        mainFrame.appendChild(sectionsContainer);

        // Position the main frame
        mainFrame.resize(
            Math.max(800, totalBars * 40 + 200), // Minimum width of 800px
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

figma.ui.onmessage = async (msg) => {
    try {
        if (msg.type === 'load-settings') {
            const config = await getConfig();
            figma.ui.postMessage({ type: 'settings-loaded', config });
        } else if (msg.type === 'save-settings') {
            await setConfig(msg.config);
            figma.ui.postMessage({ type: 'settings-saved' });
        } else if (msg.type === 'generate-arrangement') {
            const config = await getConfig();
            if (!await validateConfig(config)) {
                throw new Error('Please configure at least one API key in settings first!');
            }

            const songData = msg.songData as SongData;
            const prompt = createArrangementPrompt(
                songData.genre,
                songData.length.toString(),
                songData.tempo.toString(),
                songData.instruments
            );

            const response = await generateArrangement(config, prompt);
            console.log('Generated Arrangement Response:', response);
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