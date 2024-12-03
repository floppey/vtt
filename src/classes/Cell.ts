import { VTT } from "./VTT";

export class Cell {
  #vtt: VTT;
  #row: number;
  #col: number;

  constructor(vtt: VTT, row: number, col: number) {
    this.#vtt = vtt;
    this.#row = row;
    this.#col = col;
  }

  get row(): number {
    return this.#row;
  }

  get col(): number {
    return this.#col;
  }

  get x(): number {
    const { row } = this;
    const { gridSize, zoom, position, gridXOffset } = this.#vtt;
    const gridSizeZoomed = gridSize * zoom;
    const xOffset = (gridXOffset - position.x) * zoom;
    return row * gridSizeZoomed - xOffset;
  }

  get y(): number {
    const { col } = this;
    const { gridSize, zoom, position, gridYOffset } = this.#vtt;
    const gridSizeZoomed = gridSize * zoom;
    const yOffset = (gridYOffset - position.y) * zoom;
    return col * gridSizeZoomed - yOffset;
  }

  draw(): void {
    const { ctx, gridSize, zoom, gridColor } = this.#vtt;
    const gridSizeZoomed = gridSize * zoom;
    ctx.strokeStyle = gridColor;
    ctx.strokeRect(this.x, this.y, gridSizeZoomed, gridSizeZoomed);
  }
}
