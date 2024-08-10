figma.showUI(__html__);

figma.ui.onmessage = msg => {
  if (msg.type === 'create-layout') {
    createSongLayout(msg.data);
  }
};

async function createSongLayout(data: { genre: string, patterns: any }) {
    const { genre, patterns } = data;

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    // dimensions and spacing
    const patternHeight = 50;
    const patternWidth = 200;
    const spacing = 20;

    let xPos = 0;
    let yPos = 0;

    // frame to contain the layout
    const frame = figma.createFrame();
    frame.resizeWithoutConstraints(800, 600);
    frame.name = `${genre} Arrangement`;

    // instrument pattern
    for (const [instrument, pattern] of Object.entries(patterns)) {
        const rect = figma.createRectangle();
        rect.resize(patternWidth, patternHeight);
        rect.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.2, b: 0.2 } }];

        rect.x = xPos;
        rect.y = yPos;

        frame.appendChild(rect);

        const text = figma.createText();
        text.characters = instrument;
        text.fontSize = 12;
        text.x = xPos + 5; 
        text.y = yPos + 5;

        frame.appendChild(text);

        yPos += patternHeight + spacing;
    }

    frame.x = (figma.viewport.bounds.width - frame.width) / 2;
    frame.y = (figma.viewport.bounds.height - frame.height) / 2;

    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.notify("Song layout created!");
}