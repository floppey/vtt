import Unit from "@/vtt/classes/Unit";
import { VTT } from "@/vtt/classes/VTT";
import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";

/**
 * Render fog of war for the given units by merging their explored masks.
 * Unexplored areas are always 100% opaque black, regardless of darkness.
 */
export const renderFogOfWar = (vtt: VTT, units: Unit[]): void => {
  // Only consider units that are placed on the map (have a grid position)
  const placedUnits = units.filter((u) => u.gridPosition !== null);
  if (placedUnits.length === 0) return;
  const ctx = vtt.ctx.background;
  if (!ctx || !vtt.grid) return;

  const mapWidth = vtt.backgroundImageSize.width;
  const mapHeight = vtt.backgroundImageSize.height;
  if (mapWidth === 0 || mapHeight === 0) return;

  // Ensure all units have their explored masks built
  for (const unit of placedUnits) {
    if (!unit.exploredMask) {
      unit.rebuildExploredMask();
    }
  }

  // Create a combined explored mask by compositing all units' masks (union)
  const combinedMask = document.createElement("canvas");
  combinedMask.width = mapWidth;
  combinedMask.height = mapHeight;
  const combinedCtx = combinedMask.getContext("2d");
  if (!combinedCtx) return;

  // source-over accumulates: any pixel explored by ANY unit is revealed
  combinedCtx.globalCompositeOperation = "source-over";
  for (const unit of placedUnits) {
    if (unit.exploredMask) {
      combinedCtx.drawImage(unit.exploredMask, 0, 0);
    }
  }

  // Create the fog canvas: solid black, then punch out combined explored areas
  const fogCanvas = document.createElement("canvas");
  fogCanvas.width = mapWidth;
  fogCanvas.height = mapHeight;
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) return;

  // Fill with solid black fog (unexplored = always 100% opaque)
  fogCtx.fillStyle = "rgb(0, 0, 0)";
  fogCtx.fillRect(0, 0, mapWidth, mapHeight);

  // Punch out explored areas using the combined mask
  fogCtx.globalCompositeOperation = "destination-out";
  fogCtx.drawImage(combinedMask, 0, 0);

  // Draw the fog layer on the main canvas
  ctx.globalCompositeOperation = "source-over";
  renderFullscreenImage(vtt, "background", fogCanvas);
};
