import { hexToRgb } from "@/util/hexToRgb";
import { VTT } from "../classes/VTT";

export const renderLights = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.lights?.length ?? 0) === 0) {
    return;
  }

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = vtt.backgroundImageSize.width;
  tmpCanvas.height = vtt.backgroundImageSize.height;
  const tmpCtx = tmpCanvas.getContext("2d")!;

  const ctx = vtt.ctx.background;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  // ctx.globalAlpha = 0.25;

  tmpCtx.fillStyle = "black";
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

  mapData.lights.forEach((light) => {
    const x = light.position.x * vtt.gridSize.width + vtt.gridXOffset;
    const y = light.position.y * vtt.gridSize.height + vtt.gridYOffset;
    const radius =
      (light.range * (vtt.gridSize.width + vtt.gridSize.height)) / 2;
    const color = hexToRgb(light.color);
    // Create a radial gradient
    const gradient = tmpCtx.createRadialGradient(
      x, // Gradient center x (light position)
      y, // Gradient center y (light position)
      0, // Start radius (light is strongest at the center)
      x, // End radius x (same as center for a circular light)
      y, // End radius y (same as center for a circular light)
      radius // End radius (light fades at this distance)
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
    tmpCtx.arc(x, y, radius, 0, Math.PI * 2);
    tmpCtx.fill();
  });

  // Draw the temporary canvas on the main canvas
  ctx.drawImage(tmpCanvas, 0, 0);

  ctx.restore();
};
