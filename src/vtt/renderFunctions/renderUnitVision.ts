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
 * Render unit vision with wall occlusion and light-extended area (CPU-based).
 *
 * Algorithm:
 * 1. Create a fog overlay canvas filled with semi-transparent black.
 * 2. For each unit:
 *    a. Compute a full LOS polygon (wall-occluded, map-diagonal radius) to determine
 *       what the unit has direct line-of-sight to.
 *    b. Filter lights whose positions fall within the full LOS polygon.
 *    c. Build a "vision mask" = darkvision circle ∪ all visible light circles.
 *    d. The visible area = full LOS polygon ∩ vision mask.
 *       (i.e., the unit sees any point it has LOS to, as long as the point is
 *       within darkvision range OR within a visible light's radius.)
 *    e. Cut out the visible area from the fog (destination-out).
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

    // Compute full LOS polygon (wall-occluded, map-diagonal range)
    const fullLOSPolygon = computeVisibilityPolygon(
      origin,
      walls,
      maxLOSRadius
    );
    if (fullLOSPolygon.length < 3) continue;

    // Filter visible lights: only those whose center is within the unit's LOS
    const visibleLights = allLights.filter((light) => {
      const lightRadiusPx = Math.max(light.bright, light.dim);
      if (lightRadiusPx <= 0) return false;
      return isPointInPolygon(light.position, fullLOSPolygon);
    });

    // Build the visible area using canvas compositing:
    // visible area = full LOS polygon ∩ (darkvision circle ∪ light circles)
    const visionCanvas = document.createElement("canvas");
    visionCanvas.width = mapWidth;
    visionCanvas.height = mapHeight;
    const visionCtx = visionCanvas.getContext("2d");
    if (!visionCtx) continue;

    // Step 1: Draw the vision mask (darkvision circle + light circles)
    visionCtx.fillStyle = "white";

    // Darkvision circle
    visionCtx.beginPath();
    visionCtx.arc(origin.x, origin.y, visionRadiusPx, 0, Math.PI * 2);
    visionCtx.fill();

    // Add each visible light's area
    for (const light of visibleLights) {
      const lightRadiusPx = Math.max(light.bright, light.dim);
      visionCtx.beginPath();
      visionCtx.arc(
        light.position.x,
        light.position.y,
        lightRadiusPx,
        0,
        Math.PI * 2
      );
      visionCtx.fill();
    }

    // Step 2: Intersect with full LOS polygon.
    // Keep only the parts of the vision mask that are inside the LOS polygon.
    visionCtx.globalCompositeOperation = "destination-in";
    traceVisibilityPolygon(visionCtx, fullLOSPolygon);
    visionCtx.fill();

    // Step 3: Use the resulting vision shape to cut out fog
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.drawImage(visionCanvas, 0, 0);
    fogCtx.restore();
  }

  // Composite the fog overlay onto the background canvas
  renderFullscreenImage(vtt, "background", fogCanvas);
};
