import { VTT } from "../classes/VTT";

export const renderUnitVision = (vtt: VTT) => {
  // Create a temporary canvas for the fog
  const fogCanvas = document.createElement("canvas");
  const mapWidth = vtt.canvas.width;
  const mapHeight = vtt.canvas.height;
  fogCanvas.width = mapWidth;
  fogCanvas.height = mapHeight;
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) return;

  // Fill with black fog
  fogCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
  fogCtx.fillRect(0, 0, mapWidth, mapHeight);

  const units = vtt.selectedUnits.length > 0 ? vtt.selectedUnits : vtt.units;

  // Clear fog of war around units
  units.forEach((unit) => {
    if (!unit.cell) return;
    const { x, y } = unit.cell;

    const centerX = x + (unit.width / 2) * vtt.zoom;
    const centerY = y + (unit.height / 2) * vtt.zoom;

    // Create radial gradient for vision
    const gradient = fogCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      unit.visionRadius * vtt.gridSize.width * vtt.zoom
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");

    // Clear current vision
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.fillStyle = gradient;
    fogCtx.beginPath();
    fogCtx.arc(
      centerX,
      centerY,
      unit.visionRadius * vtt.gridSize.width * vtt.zoom,
      0,
      Math.PI * 2
    );
    fogCtx.fill();
  });

  // Draw the fog overlay
  vtt.ctx.drawImage(fogCanvas, 0, 0);
};
