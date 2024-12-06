import { VTT } from "../classes/VTT";
import { Size } from "../types/types";

export const renderFullscreenImage = (
  vtt: VTT,
  source: HTMLImageElement | HTMLCanvasElement
): void => {
  const { ctx, windowSize } = vtt;
  const viewportSize: Size = {
    width: windowSize.width,
    height: windowSize.height,
  };

  const position = vtt.getPosition();

  const width =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const visibleWidth = Math.min(width, viewportSize.width) / vtt.zoom;
  const visibleHeight = Math.min(height, viewportSize.height) / vtt.zoom;

  const sxFactor = width / source.width;
  const syFactor = height / source.height;

  const sx = -position.x * sxFactor;
  const sy = -position.y * syFactor;
  const sw = visibleWidth;
  const sh = visibleHeight;

  const dx = 0;
  const dy = 0;
  const dw = viewportSize.width;
  const dh = viewportSize.height;

  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
};
