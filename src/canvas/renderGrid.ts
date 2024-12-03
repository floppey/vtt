import { VTT } from "../classes/VTT";

function renderGrid(vtt: VTT): void {
  const { gridSize, position, ctx, zoom, gridXOffset, gridYOffset, gridColor } =
    vtt;
  const { width, height } = ctx.canvas;

  const gridSizeZoomed = gridSize * zoom;

  const xOffset = ((gridXOffset + position.x) * zoom) % gridSizeZoomed;
  const yOffset = ((gridYOffset + position.y) * zoom) % gridSizeZoomed;

  ctx.strokeStyle = gridColor;
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
