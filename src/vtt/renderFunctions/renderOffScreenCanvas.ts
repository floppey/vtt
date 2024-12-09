import { VTT } from "../classes/VTT";
import { Size } from "../types/types";

export const renderOffScreenCanvas = (vtt: VTT): void => {
  const { ctx, windowSize, offScreenCanvas } = vtt;
  const viewportSize: Size = windowSize;
  const zoom = vtt.zoom;

  const drawCtx = ctx;

  const { width, height } = offScreenCanvas;
  const position = vtt.getPosition();

  const visibleWidth = Math.min(width, viewportSize.width) / zoom;
  const visibleHeight = Math.min(height, viewportSize.height) / zoom;

  const sx = -position.x;
  const sy = -position.y;
  const sw = visibleWidth;
  const sh = visibleHeight;

  const dx = 0;
  const dy = 0;
  const dw = viewportSize.width;
  const dh = viewportSize.height;
  try {
    drawCtx.drawImage(offScreenCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
  } catch (e) {
    console.error(e);
  }
};
