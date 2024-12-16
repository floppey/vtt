import { BaseClass } from "@/vtt/classes/BaseClass";
import { VTT } from "@/vtt/classes/VTT";

interface CellProps {
  vtt: VTT;
  row: number;
  col: number;
}

export class Cell extends BaseClass {
  #vtt: VTT;
  #row: number;
  #col: number;
  #isSelected: boolean = false;

  constructor({ vtt, row, col }: CellProps) {
    super();
    this.#vtt = vtt;
    this.#row = row;
    this.#col = col;
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
    return this.#row * this.#vtt.gridSize.height;
  }

  getX(): number {
    return this.#col * this.#vtt.gridSize.width;
  }

  onClick(): void {
    if (this.vtt.isDebug) {
      this.#isSelected = !this.#isSelected;
      this.vtt.render("background");
    }
  }

  draw(): void {
    const { gridSize, gridColor } = this.#vtt;
    const ctx = this.#vtt.ctx.background;
    const width = gridSize.width;
    const height = gridSize.height;
    ctx.strokeStyle = gridColor;

    // Set line width based on zoom so that the grid doesn't get too thick, and doesn't disappear
    ctx.lineWidth = Math.max(1, Math.min(4, 4 / this.#vtt.zoom));

    ctx.strokeRect(this.#col * height, this.#row * width, width, height);

    if (this.#isSelected) {
      ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
      ctx.fillRect(this.#col * height, this.#row * width, width, height);
    }

    if (this.vtt.isDebug) {
      ctx.fillStyle = "orange";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `${this.#row}, ${this.#col}`,
        this.#col * height + height / 2,
        this.#row * width + width / 2
      );
    }
  }
}
