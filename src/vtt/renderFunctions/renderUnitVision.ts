import { VTT } from "@/vtt/classes/VTT";
import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";

export const renderUnitVision = (vtt: VTT) => {
  // Create a temporary canvas for the fog
  const fogCanvas = document.createElement("canvas");
  const mapWidth = vtt.canvas.background.width;
  const mapHeight = vtt.canvas.background.height;
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

    const x = unit.cell.col * vtt.gridSize.width;
    const y = unit.cell.row * vtt.gridSize.height;

    const centerX = x + unit.width / 2;
    const centerY = y + unit.height / 2;

    // Create radial gradient for vision
    const gradient = fogCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      unit.visionRadius * vtt.gridSize.width
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
      unit.visionRadius * vtt.gridSize.width,
      0,
      Math.PI * 2
    );
  });
  fogCtx.fill();

  // Draw the fog overlay
  renderFullscreenImage(vtt, "background", fogCanvas);
};
