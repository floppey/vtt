import { Coordinates } from "../types/types";
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
  #isSelected: boolean = false;
  #tempPosition: Coordinates | null = null;

  constructor({ cell, name, maxHealth, type }: InitUnitProps) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#cell = cell;
    this.#name = name;
    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth * 0.8;
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

  get width(): number {
    return this.#cell.vtt.gridSize.width;
  }

  get height(): number {
    return this.#cell.vtt.gridSize.height;
  }

  set isSelected(isSelected: boolean) {
    this.#isSelected = isSelected;
    this.#cell.vtt.shouldRender = true;
  }

  set tempPosition(tempPosition: Coordinates | null) {
    this.#tempPosition = tempPosition;
  }

  get tempPosition(): Coordinates | null {
    return this.#tempPosition;
  }

  click(): void {
    this.#isSelected = !this.#isSelected;
    this.#cell.vtt.shouldRender = true;
  }

  draw() {
    const { ctx } = this.#cell.vtt;

    this.drawUnit(ctx);

    if (this.#tempPosition) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      this.drawUnit(ctx, this.tempPosition!);
      ctx.restore();
    }
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    position: Coordinates = this.#cell
  ) {
    const { gridSize, zoom } = this.#cell.vtt;
    const width = gridSize.width * zoom;
    const height = gridSize.height * zoom;
    const { x, y } = position;

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, width, height);
    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(this.#name, x + width / 2, y + height / 2, width);

    if (this.#isSelected) {
      ctx.save();
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }

    // Health bar
    ctx.fillStyle = "black";
    ctx.fillRect(x, y - height / 5, width, height / 10);
    ctx.fillStyle = "red";
    ctx.fillRect(
      x,
      y - height / 5,
      (this.#currentHealth / this.#maxHealth) * width,
      height / 10
    );
  }
}
