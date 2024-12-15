import { Coordinates, GridPosition } from "../types/types";
import { get5eDistance } from "../util/distance/get5eDistance";
import { BaseClass } from "./BaseClass";
import { Cell } from "./Cell";
import { VTT } from "./VTT";

export interface InitUnitProps {
  vtt: VTT;
  name: string;
  maxHealth: number;
  type: string;
  gridPosition: GridPosition | null;
}

export default class Unit extends BaseClass {
  #visionRadius: number = 6; // 6 cells = 30 feet
  #vtt: VTT;
  #gridPosition: GridPosition | null;
  #name: string;
  #maxHealth: number;
  #currentHealth: number;
  #type: string;
  #tempPosition: Coordinates | null = null;
  #tempPositions: Coordinates[] = [];
  #exploredAreas: GridPosition[] = [];

  constructor({ vtt, name, maxHealth, type, gridPosition }: InitUnitProps) {
    super();
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

  set visionRadius(visionRadius: number) {
    this.#visionRadius = visionRadius;
  }

  set exploredAreas(exploredAreas: GridPosition[]) {
    this.#exploredAreas = exploredAreas;
  }

  set currentHealth(currentHealth: number) {
    this.#currentHealth = currentHealth;
  }

  set name(name: string) {
    this.#name = name;
  }

  get vtt(): VTT {
    return this.#vtt;
  }

  set vtt(vtt: VTT) {
    this.#vtt = vtt;
  }

  get width(): number {
    return this.#vtt.gridSize.width ?? 0;
  }

  get height(): number {
    return this.#vtt.gridSize.height ?? 0;
  }

  set tempPosition(tempPosition: Coordinates | null) {
    this.#tempPosition = tempPosition;
    if (!tempPosition) {
      this.#tempPositions = [];
    }
  }

  get tempPosition(): Coordinates | null {
    return this.#tempPosition;
  }

  private getTempPositions(): (Coordinates | null)[] {
    const positions: (Coordinates | null)[] = [
      {
        x: (this.cell?.col ?? 0) * this.#vtt.gridSize.width,
        y: (this.cell?.row ?? 0) * this.#vtt.gridSize.height,
      },
      ...this.#tempPositions,
      this.tempPosition,
    ];
    return positions;
  }

  addTempPosition(position: Coordinates) {
    this.#tempPositions.push(position);
  }

  /**
   * Removes the last temporary position from the list of temporary positions
   * @returns true if a position was removed, false if there are no positions to remove
   */
  removeTempPosotion(): boolean {
    if (this.#tempPositions.length === 0) {
      this.tempPosition = null;
      return false;
    }
    this.#tempPositions.pop();
    return true;
  }

  click(): void {
    this.vtt.render("foreground");
  }

  draw() {
    const ctx = this.#vtt.ctx.foreground;
    this.drawUnit(ctx);

    if (this.tempPosition) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      this.drawUnit(ctx, this.tempPosition);
      ctx.restore();

      // draw a line from the original position to the new position, with a circle at each end
      this.drawPath();
    }
  }

  private drawPath() {
    if (!this.tempPosition) {
      return;
    }
    const ctx = this.#vtt.ctx.foreground;
    const positions = this.getTempPositions();

    let numberOfDiagonalMoves = 0;
    let totalDistance = 0;
    ctx.save();
    positions.forEach((position, index) => {
      if (!position) {
        return;
      }
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.fillStyle = "rgba(0,0,255,0.5)";
      ctx.lineWidth = Math.min(this.width, this.height) / 5;
      const oldPosition = positions[index - 1];

      const center = {
        x: position.x + this.width / 2,
        y: position.y + this.height / 2,
      };
      if (oldPosition) {
        const oldCenter = {
          x: oldPosition.x + this.width / 2,
          y: oldPosition.y + this.height / 2,
        };
        ctx.moveTo(oldCenter.x, oldCenter.y);

        ctx.lineTo(center.x, center.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          oldCenter.x,
          oldCenter.y,
          Math.min(this.width, this.height) / 5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw distance text at the center of the line
        const { numberOfFeet, diagonalMoves } = get5eDistance(
          oldCenter,
          center,
          this.#vtt.gridSize,
          5,
          numberOfDiagonalMoves % 2 === 0
        );
        totalDistance += numberOfFeet;
        numberOfDiagonalMoves += diagonalMoves;
        // Calculate midpoint
        const midX = (oldCenter.x + center.x) / 2;
        const midY = (oldCenter.y + center.y) / 2;
        // Rotate text with the angle of the line
        const angle = Math.atan2(
          center.y - oldCenter.y,
          center.x - oldCenter.x
        );
        // ctx.moveTo(
        //   (center.x + oldCenter.x) / 2,
        //   (center.y + oldCenter.y) / 2
        // );
        // ctx.save();
        // ctx.rotate(angle);

        // ctx.fillStyle = "black";
        // ctx.font = "24px Arial";
        // ctx.textAlign = "center";
        // ctx.fillText(
        //   `${distance} ft`,
        //   (center.x + oldCenter.x) / 2,
        //   (center.y + oldCenter.y) / 2
        // );
        // ctx.restore();

        // Save the current canvas state
        ctx.save();

        // Translate to midpoint and rotate
        ctx.translate(midX, midY);
        ctx.rotate(angle);

        // Adjust rotation to keep text upright
        if (Math.abs(angle) > Math.PI / 2 || Math.abs(angle) < -Math.PI / 2) {
          ctx.rotate(Math.PI);
        }

        // Draw distance text
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${numberOfFeet} ft`, 0, 0);

        // Restore canvas state
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(
        center.x,
        center.y,
        Math.min(this.width, this.height) / 5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw the total distance at the end of the path
      if (index === positions.length - 1) {
        ctx.fillStyle = "black";
        ctx.font = "36px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `${totalDistance} ft`,
          center.x,
          center.y - this.height / 3
        );
      }
    });
    ctx.restore();
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

  toString(): string {
    const createProps: Omit<CreateUnitProps, "vtt"> = {
      name: this.#name,
      id: this.id,
      maxHealth: this.#maxHealth,
      currentHealth: this.#currentHealth,
      exploredAreas: this.#exploredAreas,
      type: this.#type,
      gridPosition: this.#gridPosition,
      visionRadius: this.#visionRadius,
    };
    return JSON.stringify(createProps);
  }
}

export interface CreateUnitProps extends InitUnitProps {
  id: string;
  currentHealth: number;
  exploredAreas: GridPosition[];
  visionRadius: number;
}

export const createUnit = ({
  id,
  currentHealth,
  exploredAreas,
  visionRadius,
  ...rest
}: CreateUnitProps): Unit => {
  const unit = new Unit(rest);
  unit.id = id;
  unit.currentHealth = currentHealth;
  unit.exploredAreas = exploredAreas;
  unit.visionRadius = visionRadius;
  return unit;
};
