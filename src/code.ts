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

        // Calculate total bars
        const totalBars = arrangement.sections.reduce((total, section) => 
            total + section.duration, 0);

        // Create main container
        const mainFrame = figma.createFrame();
        mainFrame.name = arrangement.title || "Song Arrangement";
        mainFrame.layoutMode = "VERTICAL";
        mainFrame.itemSpacing = 24;
        mainFrame.paddingTop = 32;
        mainFrame.paddingBottom = 32;
        mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Create and add grid
        const grid = createGrid(totalBars);
        mainFrame.appendChild(grid);

        // Create tracks container
        const tracksFrame = figma.createFrame();
        tracksFrame.name = "Instrument Tracks";
        tracksFrame.layoutMode = "VERTICAL";
        tracksFrame.itemSpacing = 8;
        tracksFrame.fills = [];
        mainFrame.appendChild(tracksFrame);

        // Create instrument tracks
        const instruments = new Set<string>();
        arrangement.sections.forEach(section => {
            Object.keys(section.patterns).forEach(instrument => {
                instruments.add(instrument);
            });
        });

        Array.from(instruments).forEach((instrument, index) => {
            let currentBar = 0;
            arrangement.sections.forEach(section => {
                if (section.patterns[instrument]) {
                    const [track, label] = createInstrumentTrack(
                        instrument,
                        section.patterns[instrument],
                        currentBar,
                        section.duration,
                        30,
                        index
                    );
                    figma.currentPage.appendChild(track);
                    figma.currentPage.appendChild(label);
                }
                currentBar += section.duration;
            });
        });

        // Create sections
        const instrumentsList = Array.from(new Set(
            arrangement.sections.flatMap(section => Object.keys(section.patterns))
        ));

        for (const section of arrangement.sections) {
            const sectionFrame = figma.createFrame();
            sectionFrame.name = section.name;
            sectionFrame.layoutMode = "HORIZONTAL";
            sectionFrame.counterAxisSizingMode = "AUTO";
            sectionFrame.itemSpacing = 16;
            sectionFrame.fills = [];

            const sectionTitle = figma.createText();
            sectionTitle.characters = `${section.name} (Bars ${section.startBar}-${section.startBar + section.duration})`;
            sectionTitle.fontSize = 20;
            sectionTitle.fontName = { family: "Inter", style: "Bold" };
            sectionFrame.appendChild(sectionTitle);

            for (const [instrument, pattern] of Object.entries(section.patterns)) {
                const instrumentIndex = instrumentsList.indexOf(instrument);
                const block = createPatternBlock(instrument, pattern, instrumentIndex);
                sectionFrame.appendChild(block);
            }

            mainFrame.appendChild(sectionFrame);
        }

        // Resize and position the main frame
        mainFrame.resize(totalBars * 12 + 32, mainFrame.height); // Add padding
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