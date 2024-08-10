import { generateArrangement } from './openai';

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'create-layout') {
        await createSongLayout(msg.data);
    }
};

function parseInstrumentPatterns(input: string) {
    const patterns = input.split(',').map(pattern => {
        const [instrument, bars] = pattern.trim().split(':').map(str => str.trim());
        return { instrument, bars: parseInt(bars, 10) };
    });

    return patterns;
}

async function createSongLayout(data: { genre: string, length: number, tempo: number, instrumentPatterns: string }) {
    const { genre, length, tempo, instrumentPatterns } = data;

    try {
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    } catch (error) {
        console.error("Failed to load font:", error);
        figma.notify("Error: Could not load font. Please try again.");
        return;
    }

    const arrangement = await generateArrangement(genre, length, tempo);
    const { patterns, transitions } = arrangement;

    const shapeHeight = 50;
    const shapeWidth = 200;
    const spacing = 20;

    let xPos = 0;
    let yPos = 0;

    // Display instrument patterns
    for (const [instrument, pattern] of Object.entries(patterns)) {
        const shape = figma.createNodeFromSvg(`
            <svg width="${shapeWidth}" height="${shapeHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#4CAF50" />
            </svg>
        `);

        shape.x = xPos;
        shape.y = yPos;

        const text = figma.createText();
        text.characters = `${instrument} (${pattern})`;
        text.fontSize = 12;
        text.x = xPos + 5;
        text.y = yPos + 5;

        figma.currentPage.appendChild(shape);
        figma.currentPage.appendChild(text);

        yPos += shapeHeight + spacing;
    }

    // Display transition elements
    for (const transition of transitions) {
        const transitionShape = figma.createNodeFromSvg(`
            <svg width="${shapeWidth}" height="${shapeHeight}" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="50%" cy="50%" rx="90" ry="45" fill="#FF5733" />
            </svg>
        `);

        transitionShape.x = xPos;
        transitionShape.y = yPos;

        const transitionText = figma.createText();
        transitionText.characters = transition;
        transitionText.fontSize = 12;
        transitionText.x = xPos + 5;
        transitionText.y = yPos + 5;

        figma.currentPage.appendChild(transitionShape);
        figma.currentPage.appendChild(transitionText);

        yPos += shapeHeight + spacing;
    }

    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);

    figma.notify("AI-powered layout with transitions created!");
}