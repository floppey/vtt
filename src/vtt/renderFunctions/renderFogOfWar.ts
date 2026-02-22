import Unit from "@/vtt/classes/Unit";
import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";

export const renderFogOfWar = (unit: Unit): void => {
  if (!unit.cell) return;
  const { grid } = unit.vtt ?? {};
  const ctx = unit.vtt?.ctx.background;
  if (!ctx || !grid) return;

  // Lazy-build the explored mask if it hasn't been created yet
  if (!unit.exploredMask) {
    unit.rebuildExploredMask();
  }

  const mapWidth = unit.vtt.backgroundImageSize.width;
  const mapHeight = unit.vtt.backgroundImageSize.height;
  if (mapWidth === 0 || mapHeight === 0) return;

  // Create a temporary canvas for the fog
  const fogCanvas = document.createElement("canvas");
  fogCanvas.width = mapWidth;
  fogCanvas.height = mapHeight;
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) return;

  // Fill with black fog
  fogCtx.fillStyle = "rgb(0, 0, 0)";
  fogCtx.fillRect(0, 0, mapWidth, mapHeight);

  // Punch out explored areas using the explored mask
  if (unit.exploredMask) {
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.drawImage(unit.exploredMask, 0, 0);
  }

  // Draw the fog layer on the main canvas
  ctx.globalCompositeOperation = "source-over";
  renderFullscreenImage(unit.vtt, "background", fogCanvas);
};
