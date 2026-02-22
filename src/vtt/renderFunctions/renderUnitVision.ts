import { VTT } from "@/vtt/classes/VTT";
import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";
import { computeVisibilityPolygon } from "@/vtt/util/computeVisibilityPolygon";
import { Light, Wall } from "@/vtt/types/mapData/MapData";
import { Coordinates } from "@/vtt/types/types";

/**
 * Collect all vision-blocking segments: walls + closed doors that block vision.
 * Same pattern used in renderLightsWithWalls.ts.
 */
function collectVisionWalls(vtt: VTT): Wall[] {
  const mapData = vtt.mapData;
  if (!mapData) return [];

  return [
    ...mapData.walls.filter((w) => w.blocksVision),
    ...mapData.doors
      .filter((door) => door.blocksVision && !door.isOpen)
      .map((door) => ({
        start: door.start,
        end: door.end,
        blocksMovement: true,
        blocksVision: door.blocksVision,
      })),
  ];
}

/**
 * Draw a visibility polygon as a path on the given context.
 */
function traceVisibilityPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Coordinates[]
): void {
  if (polygon.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
}

/**
 * Test if a point is inside a polygon using the ray-casting algorithm.
 */
function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Collect all light sources: map-placed lights + unit-emitted lights.
 * Map lights have bright/dim in pixel coordinates.
 * Unit lights from toLight() have bright/dim in grid cells — convert to pixels.
 */
function collectAllLights(vtt: VTT): Light[] {
  const mapData = vtt.mapData;
  if (!mapData) return [];

  const mapLights = mapData.lights ?? [];

  const unitLights = vtt.units
    .filter((unit) => unit.gridPosition !== null)
    .map((unit) => {
      const light = unit.toLight();
      // Unit.toLight() returns bright/dim in grid cells; convert to pixels
      light.bright = light.bright * vtt.gridSize.width;
      light.dim = light.dim * vtt.gridSize.width;
      return light;
    });

  return [...mapLights, ...unitLights];
}

/**
 * Render unit vision with wall occlusion and lit-area extension (CPU-based).
 *
 * Algorithm:
 * 1. Create a fog overlay canvas filled with semi-transparent black.
 * 2. For each unit:
 *    a. Compute wall-occluded visibility polygon at visionRadius (base dark vision).
 *    b. Cut out the base vision polygon from the fog (destination-out).
 *    c. Compute a full LOS polygon (wall-occluded, unlimited radius).
 *    d. For each light source visible within the full LOS:
 *       - Compute the light's own wall-occluded visibility polygon.
 *       - The intersection of (light polygon) ∩ (full LOS polygon) represents
 *         lit areas the unit can see.
 *    e. Draw these lit areas minus the base vision polygon onto the fog (destination-out).
 * 3. Composite the fog onto the background canvas.
 */
export const renderUnitVision = (vtt: VTT) => {
  const mapWidth = vtt.canvas.background.width;
  const mapHeight = vtt.canvas.background.height;
  if (mapWidth === 0 || mapHeight === 0) return;

  const walls = collectVisionWalls(vtt);
  const units = vtt.selectedUnits.length > 0 ? vtt.selectedUnits : vtt.units;
  if (units.length === 0) return;

  // Collect all light sources once
  const allLights = collectAllLights(vtt);

  // Create a temporary canvas for the fog overlay
  const fogCanvas = document.createElement("canvas");
  fogCanvas.width = mapWidth;
  fogCanvas.height = mapHeight;
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) return;

  // Fill with dark fog
  fogCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
  fogCtx.fillRect(0, 0, mapWidth, mapHeight);

  // Max LOS range: map diagonal so we never clip within the map bounds
  const maxLOSRadius = Math.sqrt(mapWidth * mapWidth + mapHeight * mapHeight);

  for (const unit of units) {
    if (!unit.cell) continue;

    const centerX = unit.cell.col * vtt.gridSize.width + unit.width / 2;
    const centerY = unit.cell.row * vtt.gridSize.height + unit.height / 2;
    const origin: Coordinates = { x: centerX, y: centerY };
    const visionRadiusPx = unit.visionRadius * vtt.gridSize.width;

    // --- Step A: Base vision polygon (clipped to visionRadius) ---
    const basePolygon = computeVisibilityPolygon(origin, walls, visionRadiusPx);

    // Cut out base vision from fog
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.fillStyle = "rgba(0, 0, 0, 1)";
    traceVisibilityPolygon(fogCtx, basePolygon);
    fogCtx.fill();
    fogCtx.restore();

    // --- Step B: Extended vision in lit areas (CPU-based) ---
    if (allLights.length === 0) continue;

    // Compute full LOS polygon (no radius limit, only wall occlusion)
    const fullLOSPolygon = computeVisibilityPolygon(
      origin,
      walls,
      maxLOSRadius
    );
    if (fullLOSPolygon.length < 3) continue;

    // Create a mask canvas for the lit extension area
    const litMaskCanvas = document.createElement("canvas");
    litMaskCanvas.width = mapWidth;
    litMaskCanvas.height = mapHeight;
    const litMaskCtx = litMaskCanvas.getContext("2d");
    if (!litMaskCtx) continue;

    // For each light source, check if the unit can see it (light position
    // is within the unit's full LOS polygon). If so, compute the light's
    // wall-occluded visibility polygon and draw it as a lit area.
    let hasLitAreas = false;

    for (const light of allLights) {
      const lightRadiusPx = Math.max(light.bright, light.dim);
      if (lightRadiusPx <= 0) continue;

      // Skip lights that are too far away to matter (optimization)
      const dx = light.position.x - origin.x;
      const dy = light.position.y - origin.y;
      const distToLight = Math.sqrt(dx * dx + dy * dy);
      if (distToLight > maxLOSRadius + lightRadiusPx) continue;

      // Check if the light's position is visible to the unit
      // (i.e., no walls between unit and light)
      if (!isPointInPolygon(light.position, fullLOSPolygon)) continue;

      // Compute the light's own wall-occluded visibility polygon
      const lightPolygon = computeVisibilityPolygon(
        light.position,
        walls,
        lightRadiusPx
      );
      if (lightPolygon.length < 3) continue;

      // Draw the light's visibility polygon onto the lit mask.
      // This represents the area illuminated by this light source.
      litMaskCtx.fillStyle = "white";
      traceVisibilityPolygon(litMaskCtx, lightPolygon);
      litMaskCtx.fill();
      hasLitAreas = true;
    }

    if (!hasLitAreas) continue;

    // Intersect lit areas with the unit's full LOS polygon:
    // Only keep lit areas that the unit can actually see (no walls between).
    litMaskCtx.globalCompositeOperation = "destination-in";
    litMaskCtx.fillStyle = "white";
    traceVisibilityPolygon(litMaskCtx, fullLOSPolygon);
    litMaskCtx.fill();

    // Subtract the base vision polygon (already revealed in Step A)
    litMaskCtx.globalCompositeOperation = "destination-out";
    litMaskCtx.fillStyle = "white";
    traceVisibilityPolygon(litMaskCtx, basePolygon);
    litMaskCtx.fill();

    // litMaskCanvas now contains white only where:
    // (within full LOS) AND (outside base vision) AND (illuminated by a light)
    // Use it to cut additional area from the fog
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.drawImage(litMaskCanvas, 0, 0);
    fogCtx.restore();
  }

  // Composite the fog overlay onto the background canvas
  renderFullscreenImage(vtt, "background", fogCanvas);
};
