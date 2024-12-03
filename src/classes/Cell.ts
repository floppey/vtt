import { VTT } from "./VTT";

export class Cell {
  #vtt: VTT;
  #x: number;
  #y: number;

  constructor(vtt: VTT, x: number, y: number) {
    this.#vtt = vtt;
    this.#x = x;
    this.#y = y;
  }

  get x(): number {
    return this.#x;
  }

  get y(): number {
    return this.#y;
  }

  draw(): void {
    const {
      ctx,
      gridSize,
      zoom,
      position,
      gridXOffset,
      gridYOffset,
      gridColor,
    } = this.#vtt;
    const { x, y } = this;

    const gridSizeZoomed = gridSize * zoom;

    const xOffset = (gridXOffset - position.x) * zoom;
    const yOffset = (gridYOffset - position.y) * zoom;

    const cellX = x * gridSizeZoomed - xOffset;
    const cellY = y * gridSizeZoomed - yOffset;

    ctx.strokeStyle = gridColor;
    ctx.strokeRect(cellX, cellY, gridSizeZoomed, gridSizeZoomed);
  }
}
