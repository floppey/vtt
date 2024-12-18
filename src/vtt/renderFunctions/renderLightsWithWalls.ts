import { hexToRgb } from "@/util/hexToRgb";
import { VTT } from "../classes/VTT";
import { Coordinates } from "../types/types";
import { Light } from "@/context/mapSettingsContext";

interface Wall {
  start: Coordinates;
  end: Coordinates;
}

const wallIntersectsLight = (wall: Wall, light: Light): boolean => {
  const { start, end } = wall;
  const { x, y } = light.position;
  const radius = light.range;
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

export const renderLightsWithWalls = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.lights?.length ?? 0) === 0) {
    return;
  }

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = vtt.backgroundImageSize.width;
  tmpCanvas.height = vtt.backgroundImageSize.height;
  const tmpCtx = tmpCanvas.getContext("2d");

  if (!tmpCtx) {
    return;
  }

  // fix lights
  const lights = mapData.lights.map((light) => {
    return {
      ...light,
      position: {
        x: light.position.x * vtt.gridSize.width + vtt.gridXOffset,
        y: light.position.y * vtt.gridSize.height + vtt.gridYOffset,
      },
      range: (light.range * (vtt.gridSize.width + vtt.gridSize.height)) / 2,
    };
  });

  const ctx = vtt.ctx.background;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";

  tmpCtx.fillStyle = "black";
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

  // Flatten wall segments into a single array of wall lines
  const walls: Wall[] = [];
  mapData.line_of_sight.forEach((wallSegment) => {
    for (let i = 0; i < wallSegment.length - 1; i++) {
      walls.push({
        start: {
          x: wallSegment[i].x * vtt.gridSize.width + vtt.gridXOffset,
          y: wallSegment[i].y * vtt.gridSize.height + vtt.gridYOffset,
        },
        end: {
          x: wallSegment[i + 1].x * vtt.gridSize.width + vtt.gridXOffset,
          y: wallSegment[i + 1].y * vtt.gridSize.height + vtt.gridYOffset,
        },
      });
    }
  });

  lights.forEach((light, lightIndex) => {
    tmpCtx.save();

    const color = hexToRgb(light.color);
    // Create a radial gradient
    const gradient = tmpCtx.createRadialGradient(
      light.position.x, // Gradient center x (light position)
      light.position.y, // Gradient center y (light position)
      0, // Start radius (light is strongest at the center)
      light.position.x, // End radius x (same as center for a circular light)
      light.position.y, // End radius y (same as center for a circular light)
      light.range // End radius (light fades at this distance)
    );

    // Add color stops for the gradient (light intensity and color)
    gradient.addColorStop(
      0,
      `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    ); // Center of the light
    gradient.addColorStop(0.9, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`); // Near edge of the light (fades to half intensity)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`); // Edge of the light (fades to transparent)

    // Set the fill style to the gradient
    tmpCtx.fillStyle = gradient;
    // Draw a circle (the "light" shape) on the canvas
    tmpCtx.beginPath();
    tmpCtx.arc(light.position.x, light.position.y, light.range, 0, Math.PI * 2);
    tmpCtx.fill();

    if (vtt.isDebug) {
      tmpCtx.fillStyle = "black";
      tmpCtx.beginPath();
      tmpCtx.arc(
        light.position.x,
        light.position.y,
        vtt.gridSize.height / 3,
        0,
        Math.PI * 2
      );
      tmpCtx.fill();
      tmpCtx.fillStyle = "white";
      tmpCtx.font = "12px Arial";
      tmpCtx.textAlign = "center";
      tmpCtx.textBaseline = "middle";
      tmpCtx.fillText(
        lightIndex.toString(),
        light.position.x,
        light.position.y
      );
    }

    const intersectingWalls = walls.filter((wall) =>
      wallIntersectsLight(wall, light)
    );
    intersectingWalls.forEach((wall, index) => {
      const wallCenter: Coordinates = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };
      // Calculate angle for clipping
      const startAngle = Math.atan2(
        wall.start.y - light.position.y,
        wall.start.x - light.position.x
      );
      const endAngle = Math.atan2(
        wall.end.y - light.position.y,
        wall.end.x - light.position.x
      );
      const centerAngle = Math.atan2(
        wallCenter.y - light.position.y,
        wallCenter.x - light.position.x
      );

      // Create clipping path
      tmpCtx.fillStyle = "black";
      if (vtt.isDebug) {
        const colors = [
          "green",
          "blue",
          "red",
          "yellow",
          "purple",
          "orange",
          "pink",
          "teal",
          "brown",
          "gray",
          "cyan",
          "magenta",
        ];
        tmpCtx.fillStyle = colors[index % colors.length];
      }

      tmpCtx.beginPath();
      tmpCtx.moveTo(wall.start.x, wall.start.y);
      tmpCtx.lineTo(wall.end.x, wall.end.y);
      // line to the end of the light, using endAngle
      tmpCtx.lineTo(
        light.position.x + light.range * Math.cos(endAngle),
        light.position.y + light.range * Math.sin(endAngle)
      );

      // curved line from the end of the light using endAngle to the end of the light using startAngle. This should follow the outside of the light circle
      tmpCtx.quadraticCurveTo(
        light.position.x + light.range * Math.cos(centerAngle),
        light.position.y + light.range * Math.sin(centerAngle),
        light.position.x + light.range * Math.cos(startAngle),
        light.position.y + light.range * Math.sin(startAngle)
      );

      tmpCtx.closePath();
      // tmpCtx.clip();
      tmpCtx.fill();
    });
    tmpCtx.restore();
  });

  // Draw the temporary canvas on the main canvas
  ctx.drawImage(tmpCanvas, 0, 0);

  ctx.restore();
};
