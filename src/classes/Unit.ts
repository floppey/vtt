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
  #visionRadius: number = 6; // 6 cells = 30 feet
  #vtt: VTT;
  #gridPosition: GridPosition | null;
  #name: string;
  #maxHealth: number;
  #currentHealth: number;
  #type: string;
  #tempPosition: Coordinates | null = null;
  #exploredAreas: GridPosition[] = [];

  constructor({ vtt, name, maxHealth, type, gridPosition }: InitUnitProps) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#vtt = vtt;
    this.#gridPosition = gridPosition ?? null;
    this.#name = name;
    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth * 0.8;
    this.#type = type;
    if (gridPosition) {
      this.#exploredAreas.push(gridPosition);
    }
  }

  get id(): number {
    return this.#id;
  }

  get visionRadius(): number {
    return this.#visionRadius;
  }

  get exploredAreas(): GridPosition[] {
    return this.#exploredAreas;
  }

  get cell(): Cell | null {
    if (!this.#gridPosition) {
      return null;
    }
    return this.#vtt.grid.cells[this.#gridPosition?.row]?.[
      this.#gridPosition?.col
    ];
  }

  get gridPosition(): GridPosition | null {
    return this.#gridPosition;
  }

  set cell(cell: Cell | null) {
    if (!cell) {
      this.#gridPosition = null;
      return;
    }
    this.#gridPosition = { row: cell.row, col: cell.col };
    if (
      !this.#exploredAreas.some(
        (area) => area.row === cell.row && area.col === cell.col
      )
    ) {
      this.#exploredAreas.push(this.#gridPosition);
    }
  }

  get vtt(): VTT {
    return this.#vtt;
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
    this.#vtt.shouldRenderAll = true;
  }

  draw() {
    const { offScreenCtx } = this.#vtt;

    this.drawUnit(offScreenCtx);

    if (this.#tempPosition) {
      offScreenCtx.save();
      offScreenCtx.globalAlpha = 0.5;
      this.drawUnit(offScreenCtx, this.tempPosition!);
      offScreenCtx.restore();
    }
  }

  get isSelected(): boolean {
    return this.#vtt.selectedUnits.includes(this);
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    position?: Coordinates | null
  ) {
    const { gridSize } = this.#vtt;
    const width = gridSize.width;
    const height = gridSize.height;
    if (!position) {
      position = {
        x: (this.cell?.col ?? 0) * width,
        y: (this.cell?.row ?? 0) * height,
      };
    }
    const { x, y } = position;

    if (!position) {
      return;
    }

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, width, height);
    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(this.#name, x + width / 2, y + height / 2, width);
    if (this.vtt.isDebug) {
      ctx.fillText(
        `${this.cell?.row}, ${this.cell?.col}`,
        x + width / 2,
        y + height / 2 + 20,
        width
      );
    }

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
