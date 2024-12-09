import { Coordinates, GridPosition } from "../types/types";
import { get5eDistance } from "../util/distance/get5eDistance";
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
  #tempPositions: Coordinates[] = [];
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
    console.log("temp positions", this.#tempPositions);
  }

  click(): void {
    this.#vtt.shouldRenderAll = true;
  }

  draw() {
    const { offScreenCtx } = this.#vtt;

    this.drawUnit(offScreenCtx);

    if (this.tempPosition) {
      offScreenCtx.save();
      offScreenCtx.globalAlpha = 0.75;
      this.drawUnit(offScreenCtx, this.tempPosition);
      offScreenCtx.restore();

      // draw a line from the original position to the new position, with a circle at each end
      this.drawPath();
    }
  }

  private drawPath() {
    if (!this.tempPosition) {
      return;
    }
    const { offScreenCtx } = this.#vtt;
    const positions = this.getTempPositions();

    let numberOfDiagonalMoves = 0;
    let totalDistance = 0;
    offScreenCtx.save();
    positions.forEach((position, index) => {
      if (!position) {
        return;
      }
      offScreenCtx.beginPath();
      offScreenCtx.strokeStyle = "rgba(255,255,255,0.75)";
      offScreenCtx.fillStyle = "rgba(0,0,255,0.5)";
      offScreenCtx.lineWidth = Math.min(this.width, this.height) / 5;
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
        offScreenCtx.moveTo(oldCenter.x, oldCenter.y);

        offScreenCtx.lineTo(center.x, center.y);
        offScreenCtx.stroke();
        offScreenCtx.beginPath();
        offScreenCtx.arc(
          oldCenter.x,
          oldCenter.y,
          Math.min(this.width, this.height) / 5,
          0,
          Math.PI * 2
        );
        offScreenCtx.fill();

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
        // offScreenCtx.moveTo(
        //   (center.x + oldCenter.x) / 2,
        //   (center.y + oldCenter.y) / 2
        // );
        // offScreenCtx.save();
        // offScreenCtx.rotate(angle);

        // offScreenCtx.fillStyle = "black";
        // offScreenCtx.font = "24px Arial";
        // offScreenCtx.textAlign = "center";
        // offScreenCtx.fillText(
        //   `${distance} ft`,
        //   (center.x + oldCenter.x) / 2,
        //   (center.y + oldCenter.y) / 2
        // );
        // offScreenCtx.restore();

        // Save the current canvas state
        offScreenCtx.save();

        // Translate to midpoint and rotate
        offScreenCtx.translate(midX, midY);
        offScreenCtx.rotate(angle);

        // Adjust rotation to keep text upright
        if (Math.abs(angle) > Math.PI / 2 || Math.abs(angle) < -Math.PI / 2) {
          offScreenCtx.rotate(Math.PI);
        }

        // Draw distance text
        offScreenCtx.fillStyle = "black";
        offScreenCtx.font = "24px Arial";
        offScreenCtx.textAlign = "center";
        offScreenCtx.textBaseline = "middle";
        offScreenCtx.fillText(`${numberOfFeet} ft`, 0, 0);

        // Restore canvas state
        offScreenCtx.restore();
      }
      offScreenCtx.beginPath();
      offScreenCtx.arc(
        center.x,
        center.y,
        Math.min(this.width, this.height) / 5,
        0,
        Math.PI * 2
      );
      offScreenCtx.fill();

      // Draw the total distance at the end of the path
      if (index === positions.length - 1) {
        offScreenCtx.fillStyle = "black";
        offScreenCtx.font = "36px Arial";
        offScreenCtx.textAlign = "center";
        offScreenCtx.fillText(
          `${totalDistance} ft`,
          center.x,
          center.y - this.height / 3
        );
      }
    });
    offScreenCtx.restore();
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
