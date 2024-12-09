import { VTT } from "./VTT";

interface CellProps {
  vtt: VTT;
  row: number;
  col: number;
}

export class Cell {
  #id: number;
  #vtt: VTT;
  #row: number;
  #col: number;
  #isSelected: boolean = false;

  constructor({ vtt, row, col }: CellProps) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#vtt = vtt;
    this.#row = row;
    this.#col = col;
  }

  get id(): number {
    return this.#id;
  }

  get vtt(): VTT {
    return this.#vtt;
  }

  get row(): number {
    return this.#row;
  }

  get col(): number {
    return this.#col;
  }

  getY(): number {
    return this.#row * this.#vtt.gridSize.height * this.#vtt.zoom;
  }

  getX(): number {
    return this.#col * this.#vtt.gridSize.width * this.#vtt.zoom;
  }

  onClick(): void {
    if (this.vtt.isDebug) {
      this.#isSelected = !this.#isSelected;
      this.#vtt.shouldRenderAll = true;
    }
  }

  draw(): void {
    const { offScreenCtx, gridSize, gridColor } = this.#vtt;
    const width = gridSize.width;
    const height = gridSize.height;
    offScreenCtx.strokeStyle = gridColor;
    offScreenCtx.strokeRect(
      this.#col * height,
      this.#row * width,
      width,
      height
    );

    if (this.#isSelected) {
      offScreenCtx.fillStyle = "rgba(0, 0, 255, 0.5)";
      offScreenCtx.fillRect(
        this.#col * height,
        this.#row * width,
        width,
        height
      );
    }

    if (this.vtt.isDebug) {
      offScreenCtx.fillStyle = "orange";
      offScreenCtx.font = "24px Arial";
      offScreenCtx.textAlign = "center";
      offScreenCtx.fillText(
        `${this.#row}, ${this.#col}`,
        this.#col * height + height / 2,
        this.#row * width + width / 2
      );
    }
  }
}
