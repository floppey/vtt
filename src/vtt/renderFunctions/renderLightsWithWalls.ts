import { hexToRgb } from "@/util/hexToRgb";
import { VTT } from "../classes/VTT";
import { Coordinates } from "../types/types";
import { timeFunction } from "@/util/timeFunction";
import { Light } from "../types/mapData/MapData";
import { rgbToHex } from "@/util/rgbToHex";

interface Wall {
  start: Coordinates;
  end: Coordinates;
}

const wallIntersectsLight = (wall: Wall, light: Light): boolean => {
  const { start, end } = wall;
  const { x, y } = light.position;
  const radius = Math.max(light.bright, light.dim);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  // Calculate nearest point on the line to circle center
  const t =
    ((x - start.x) * dx + (y - start.y) * dy) / (lineLength * lineLength);
  const nearestX = start.x + t * dx;
  const nearestY = start.y + t * dy;

  const distanceToCenter = Math.sqrt(
    (nearestX - x) * (nearestX - x) + (nearestY - y) * (nearestY - y)
  );

  return distanceToCenter <= radius;
};

const getSectionOfWallThatIntersectsLight = (
  wall: Wall,
  light: Light
): Wall => {
  const { start, end } = wall;
  const { x, y } = light.position;
  const radius = Math.max(light.bright, light.dim);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  // Calculate nearest point on the line to circle center
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - start.x) * dx + (y - start.y) * dy) / (lineLength * lineLength)
    )
  );
  const nearestX = start.x + t * dx;
  const nearestY = start.y + t * dy;

  const distanceToCenter = Math.sqrt(
    (nearestX - x) * (nearestX - x) + (nearestY - y) * (nearestY - y)
  );

  // If the nearest point is further than the radius, no intersection
  if (distanceToCenter > radius) {
    return wall;
  }

  const dxFromCenter = nearestX - x;
  const dyFromCenter = nearestY - y;
  const distanceFromCenter = Math.sqrt(
    dxFromCenter * dxFromCenter + dyFromCenter * dyFromCenter
  );

  // Calculate intersection points
  const dxFromEdge = Math.sqrt(
    radius * radius - distanceFromCenter * distanceFromCenter
  );
  const angle = Math.atan2(dy, dx);

  let newStart: Coordinates = {
    x: nearestX - dxFromEdge * Math.cos(angle),
    y: nearestY - dxFromEdge * Math.sin(angle),
  };

  let newEnd: Coordinates = {
    x: nearestX + dxFromEdge * Math.cos(angle),
    y: nearestY + dxFromEdge * Math.sin(angle),
  };

  // Helper function to get distance between two points
  const getDistance = (p1: Coordinates, p2: Coordinates): number => {
    return Math.sqrt(
      (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y)
    );
  };

  // Helper function to clamp a point to the original wall segment
  const clampToWall = (point: Coordinates): Coordinates => {
    const totalDist = getDistance(start, end);
    const distToStart = getDistance(start, point);
    const distToEnd = getDistance(end, point);

    if (distToStart + distToEnd > totalDist * 1.001) {
      // Small epsilon for floating point errors
      return distToStart < distToEnd ? start : end;
    }
    return point;
  };

  // Clamp the new points to the original wall segment
  newStart = clampToWall(newStart);
  newEnd = clampToWall(newEnd);

  return { start: newStart, end: newEnd };
};

// Function to bias toward center (adjustable strength)
function biasTowardCenter(t: number): number {
  // Bias strength (0 = no bias, 1 = strong bias)
  const biasStrength = 0.15;
  const centered = t - 0.5; // Center around 0
  const quadratic = 0.5 + centered * centered * (centered > 0 ? 1 : -1); // Quadratic bias
  return t * (1 - biasStrength) + quadratic * biasStrength; // Mix linear and quadratic
}

export const renderLightsWithWalls = (vtt: VTT) => {
  if (!vtt.lightingCanvas) {
    buildLightingCanvas(vtt);
  }

  timeFunction("compositeFinal", () => {
    if (vtt.lightingCanvas) {
      const ctx = vtt.ctx.background;
      ctx.save();

      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(vtt.lightingCanvas, 0, 0);

      ctx.restore();
    }
  });
};

const buildLightingCanvas = (vtt: VTT) => {
  const mapData = vtt.mapData;
  if (!mapData || (mapData.lights?.length ?? 0) === 0) {
    return;
  }
  const { width, height } = vtt.backgroundImageSize;
  vtt.lightingCanvas = new OffscreenCanvas(width, height);
  const lightingCtx = vtt.lightingCanvas.getContext("2d");

  // Create temporary canvases for light and shadow
  const lightCanvas = new OffscreenCanvas(width, height);
  const lightCtx = lightCanvas.getContext("2d")!;

  const shadowCanvas = new OffscreenCanvas(width, height);
  const shadowCtx = shadowCanvas.getContext("2d")!;

  if (!lightingCtx || !lightCtx || !shadowCtx) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();

  lightingCtx.fillStyle = "black";
  lightingCtx.fillRect(0, 0, width, height);

  mapData.lights.forEach((light) => {
    // Clear the temporary canvases
    lightCtx.clearRect(0, 0, width, height);
    shadowCtx.clearRect(0, 0, width, height);

    // Draw the light
    lightCtx.save();

    const radius = Math.max(light.bright, light.dim);
    // Create a radial gradient
    const gradient = lightingCtx.createRadialGradient(
      light.position.x, // Gradient center x (light position)
      light.position.y, // Gradient center y (light position)
      0, // Start radius (light is strongest at the center)
      light.position.x, // End radius x (same as center for a circular light)
      light.position.y, // End radius y (same as center for a circular light)
      radius // End radius (light fades at this distance)
    );

    // Add color stops for the gradient (light intensity)
    // Center of the light
    gradient.addColorStop(0, `rgba(255,255,255, 1)`);
    // Fade to half intensity at the end of the bright range
    gradient.addColorStop(light.bright / radius, `rgba(255,255,255, 0.5)`);
    // Near edge of the light (fades to quarter intensity)
    gradient.addColorStop(0.95, `rgba(255,255,255, 0.25)`);
    // Edge of the light (fades to transparent)
    gradient.addColorStop(1, `rgba(255,255,255,  0)`);

    // Set the fill style to the gradient
    lightCtx.fillStyle = gradient;
    // Draw a circle (the "light" shape) on the canvas
    lightCtx.beginPath();
    lightCtx.arc(light.position.x, light.position.y, radius, 0, Math.PI * 2);
    lightCtx.fill();

    if (light.tintAlpha > 0) {
      // light color tint
      const color = hexToRgb(light.tintColor);
      color.a = light.tintAlpha;
      // Add color stops for the gradient (light color)
      // Center of the light
      gradient.addColorStop(0, rgbToHex(color));
      // Fade to half intensity at the end of the bright range
      color.a /= 2;
      gradient.addColorStop(light.bright / radius, rgbToHex(color));
      // Near edge of the light (fades to quarter intensity)
      color.a /= 2;
      gradient.addColorStop(0.95, rgbToHex(color));
      // Edge of the light (fades to transparent)
      color.a = 0;
      gradient.addColorStop(1, rgbToHex(color));
      lightCtx.beginPath();
      lightCtx.arc(light.position.x, light.position.y, radius, 0, Math.PI * 2);
      lightCtx.fill();
    }
    lightCtx.restore();

    // Draw shadows for this light
    shadowCtx.save();
    shadowCtx.fillStyle = "black";

    const intersectingWalls = timeFunction("lightIntersectingWalls", () =>
      mapData.walls
        .filter((wall) => wall.blocksVision && wallIntersectsLight(wall, light))
        .map((wall) => getSectionOfWallThatIntersectsLight(wall, light))
    );

    intersectingWalls.forEach((wall) => {
      // Generate 100 evenly spaced points along the wall
      const numPoints = 100; // Number of points to generate
      const points: Coordinates[] = [];
      points.push(wall.start);
      for (let i = 0; i <= numPoints; i++) {
        const linearT = i / numPoints; // Linear interpolation (0 to 1)
        const t = biasTowardCenter(linearT); // Apply bias toward center
        const x = wall.start.x + t * (wall.end.x - wall.start.x); // Interpolated x
        const y = wall.start.y + t * (wall.end.y - wall.start.y); // Interpolated y
        points.push({ x, y });
      }
      points.push(wall.end);

      const shadowLength = radius * 1.05; // Shadow length (slightly longer than light to make sure it covers the whole area)
      shadowCtx.beginPath();
      shadowCtx.moveTo(wall.start.x, wall.start.y);

      points.forEach((point) => {
        const angle = Math.atan2(
          point.y - light.position.y,
          point.x - light.position.x
        );
        shadowCtx.lineTo(
          light.position.x + shadowLength * Math.cos(angle),
          light.position.y + shadowLength * Math.sin(angle)
        );
      });

      shadowCtx.lineTo(wall.end.x, wall.end.y);
      shadowCtx.closePath();

      // shadowCtx.clip();
      shadowCtx.fill();
    });
    shadowCtx.restore();

    timeFunction("compositeShadow", () => {
      // Composite the shadow onto the light
      lightCtx.globalCompositeOperation = "luminosity";
      lightCtx.drawImage(shadowCanvas, 0, 0);
    });

    timeFunction("compositeLight", () => {
      // Add this light to the main canvas
      lightingCtx.globalCompositeOperation = "lighter";
      lightingCtx.drawImage(lightCanvas, 0, 0);
    });
  });
};
