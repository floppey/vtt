import { VTT } from "../classes/VTT";
import { Size } from "../types/types";


let isEmpty = true;

function isCanvasEmpty(canvas: HTMLCanvasElement) {
  if(!isEmpty) { return false; }
  const context = canvas.getContext('2d');
  const pixelData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  // Check if all pixels are transparent (alpha value is 0)
  for (let i = 3; i < pixelData.data.length; i += 4) {
    if (pixelData.data[i] > 0) {
      isEmpty = false;
      return false; // Canvas has some non-transparent content
    }
  }
  
  return true; // Canvas is empty (all pixels are transparent)
}


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
    if (isCanvasEmpty(offScreenCanvas)) {
      console.warn('Source canvas is empty');
    } else {
      drawCtx.drawImage(offScreenCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  } catch (e) {
    console.error(e);
  }
};
