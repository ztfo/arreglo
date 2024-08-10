import { generateArrangement } from './openai';

figma.showUI(__html__);

figma.ui.onmessage = msg => {
  if (msg.type === 'create-layout') {
    createSongLayout(msg.data);
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

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    const patterns = parseInstrumentPatterns(instrumentPatterns);

    const shapeHeight = 50;
    const shapeWidth = 200;
    const spacing = 20;

    let xPos = 0;
    let yPos = 0;

    for (const { instrument, bars } of patterns) {
        const shape = figma.createNodeFromSvg(`
            <svg width="${shapeWidth}" height="${shapeHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#4CAF50" />
            </svg>
        `);

        shape.x = xPos;
        shape.y = yPos;

        const text = figma.createText();
        text.characters = `${instrument} (${bars} bars)`;
        text.fontSize = 12;
        text.x = xPos + 5;
        text.y = yPos + 5;

        shape.appendChild(text);
        figma.currentPage.appendChild(shape);

        yPos += shapeHeight + spacing;
    }

    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);

    figma.notify("Detailed layout created!");
}