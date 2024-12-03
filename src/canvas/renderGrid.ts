import { VTT } from "../classes/VTT";

function renderGrid(vtt: VTT): void {
  const { gridSize, position, ctx, zoom } = vtt;
  const { width, height } = ctx.canvas;

  const gridSizeZoomed = gridSize * zoom;

  const xOffset = position.x % gridSizeZoomed;
  const yOffset = position.y % gridSizeZoomed;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += gridSizeZoomed) {
    ctx.beginPath();
    ctx.moveTo(xOffset + x, 0);
    ctx.lineTo(xOffset + x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSizeZoomed) {
    ctx.beginPath();
    ctx.moveTo(0, yOffset + y);
    ctx.lineTo(width, yOffset + y);
    ctx.stroke();
  }
}

export { renderGrid };
