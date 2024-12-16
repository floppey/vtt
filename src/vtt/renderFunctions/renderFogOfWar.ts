import Unit from "@/vtt/classes/Unit";
import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";

export const renderFogOfWar = (unit: Unit): void => {
  if (!unit.cell) return;
  const { grid, gridSize } = unit.vtt ?? {};
  const ctx = unit.vtt?.ctx.background;
  if (!ctx || !grid) return;

  // Create a temporary canvas for the fog
  const fogCanvas = document.createElement("canvas");
  const mapWidth = unit.vtt.backgroundImageSize.width;
  const mapHeight = unit.vtt.backgroundImageSize.height;
  fogCanvas.width = mapWidth;
  fogCanvas.height = mapHeight;
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) return;

  // Fill with black fog
  fogCtx.fillStyle = "rgb(0, 0, 0)";
  fogCtx.fillRect(0, 0, mapWidth, mapHeight);

  fogCtx.globalCompositeOperation = "destination-out";
  fogCtx.beginPath();

  unit.exploredAreas.forEach((area, index) => {
    const x = (area.col + 0.5) * gridSize.width;
    const y = (area.row + 0.5) * gridSize.height;

    // Draw a circle for each explored point
    fogCtx.moveTo(x + unit.visionRadius * gridSize.width, y); // Move without drawing
    fogCtx.arc(x, y, unit.visionRadius * gridSize.width, 0, Math.PI * 2);

    // Optionally, connect circles with a line for smoother exploration:
    if (index > 0) {
      const prev = unit.exploredAreas[index - 1];
      const prevX = (prev.col + 0.5) * gridSize.width;
      const prevY = (prev.row + 0.5) * gridSize.height;
      fogCtx.lineTo(prevX, prevY); // Smooth connections between explored points
    }
  });

  fogCtx.fill(); // Clear the explored areas from the fog layer

  // Step 3: Draw the fog layer on the main canvas
  ctx.globalCompositeOperation = "source-over";
  renderFullscreenImage(unit.vtt, "background", fogCanvas);
};
