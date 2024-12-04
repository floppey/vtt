import { Coordinates, GridPosition } from "../types/types";
import { Cell } from "./Cell";
import { VTT } from "./VTT";

export interface InitUnitProps {
  vtt: VTT;
  name: string;
  maxHealth: number;
  type: string;
  gridPosition: GridPosition | null;
}

export default class Unit {
  #id: number;
  #vtt: VTT;
  #gridPosition: GridPosition | null;
  #name: string;
  #maxHealth: number;
  #currentHealth: number;
  #type: string;
  #tempPosition: Coordinates | null = null;

  constructor({ vtt, name, maxHealth, type, gridPosition }: InitUnitProps) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#vtt = vtt;
    this.#gridPosition = gridPosition ?? null;
    this.#name = name;
    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth * 0.8;
    this.#type = type;
  }

  get id(): number {
    return this.#id;
  }

  get cell(): Cell | null {
    if (!this.#gridPosition) {
      return null;
    }
    return this.#vtt.grid.cells[this.#gridPosition?.row][
      this.#gridPosition?.col
    ];
  }

  set cell(cell: Cell | null) {
    if (!cell) {
      this.#gridPosition = null;
      return;
    }
    this.#gridPosition = { row: cell.row, col: cell.col };
  }

  get width(): number {
    return this.#vtt.gridSize.width ?? 0;
  }

  get height(): number {
    return this.#vtt.gridSize.height ?? 0;
  }

  set tempPosition(tempPosition: Coordinates | null) {
    this.#tempPosition = tempPosition;
  }

  get tempPosition(): Coordinates | null {
    return this.#tempPosition;
  }

  click(): void {
    this.#vtt.shouldRender = true;
  }

  draw() {
    const { ctx } = this.#vtt;

    this.drawUnit(ctx);

    if (this.#tempPosition) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      this.drawUnit(ctx, this.tempPosition!);
      ctx.restore();
    }
  }

  get isSelected(): boolean {
    return this.#vtt.selectedUnits.includes(this);
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    position?: Coordinates | null
  ) {
    position = position ?? this.cell;
    if (!position) {
      return;
    }
    const { gridSize, zoom } = this.#vtt;
    const width = gridSize.width * zoom;
    const height = gridSize.height * zoom;
    const { x, y } = position;

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, width, height);
    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(this.#name, x + width / 2, y + height / 2, width);

    if (this.isSelected) {
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
