import { Cell } from "./Cell";

export interface InitUnitProps {
  cell: Cell;
  name: string;
  maxHealth: number;
  type: string;
}

export default class Unit {
  #id: number;
  #cell: Cell;
  #name: string;
  #maxHealth: number;
  #currentHealth: number;
  #type: string;
  #isSelected: boolean = true;

  constructor({ cell, name, maxHealth, type }: InitUnitProps) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#cell = cell;
    this.#name = name;
    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth;
    this.#type = type;
  }

  get id(): number {
    return this.#id;
  }

  get cell(): Cell {
    return this.#cell;
  }

  set cell(cell: Cell) {
    this.#cell = cell;
  }

  set isSelected(isSelected: boolean) {
    this.#isSelected = isSelected;
  }

  draw() {
    const { ctx, gridSize, zoom } = this.#cell.vtt;
    const gridSizeZoomed = gridSize * zoom;
    const { x, y } = this.#cell;
    ctx.fillStyle = "red";

    ctx.fillRect(x, y, gridSizeZoomed, gridSizeZoomed);

    if (this.#isSelected) {
      ctx.save();
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, gridSizeZoomed, gridSizeZoomed);
      ctx.restore();
    }
  }
}
