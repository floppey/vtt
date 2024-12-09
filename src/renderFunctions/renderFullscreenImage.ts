import { VTT } from "../classes/VTT";
import { Size } from "../types/types";

export const renderFullscreenImage = (
  vtt: VTT,
  source: HTMLImageElement | HTMLCanvasElement
): void => {
  const { offScreenCtx, offScreenCanvas } = vtt;
  const viewportSize: Size = {
    width: offScreenCanvas.width,
    height: offScreenCanvas.height,
  };

  const width =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const visibleWidth = Math.min(width, viewportSize.width);
  const visibleHeight = Math.min(height, viewportSize.height);

  const sxFactor = width / source.width;
  const syFactor = height / source.height;

  const sx = 0 * sxFactor;
  const sy = 0 * syFactor;
  const sw = visibleWidth;
  const sh = visibleHeight;

  const dx = 0;
  const dy = 0;
  const dw = viewportSize.width;
  const dh = viewportSize.height;

  offScreenCtx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
};
