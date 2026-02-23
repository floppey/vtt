import { Coordinates, GridPosition } from "@/vtt/types/types";
import { get5eDistance } from "@/vtt/util/distance/get5eDistance";
import { BaseClass } from "@/vtt/classes/BaseClass";
import { Cell } from "@/vtt/classes/Cell";
import { VTT } from "@/vtt/classes/VTT";
import { Light, Wall } from "../types/mapData/MapData";
import { computeVisibilityPolygon } from "@/vtt/util/computeVisibilityPolygon";
import { segmentIntersectsWalls } from "@/vtt/util/segmentIntersectsWall";

export interface InitUnitProps {
  vtt: VTT;
  name: string;
  maxHealth: number;
  type: string;
  gridPosition: GridPosition | null;
  owner: string;
}

export default class Unit extends BaseClass {
  #owner: string;
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
  #exploredMask: HTMLCanvasElement | null = null;
  #animationPosition: Coordinates | null = null;

  constructor({
    vtt,
    name,
    maxHealth,
    type,
    gridPosition,
    owner,
  }: InitUnitProps) {
    super();
    this.#vtt = vtt;
    this.#gridPosition = gridPosition ?? null;
    this.#name = name;
    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth;
    this.#type = type;
    this.#owner = owner;
    if (gridPosition) {
      this.#exploredAreas.push(gridPosition);
    }
  }

  get visionRadius(): number {
    return this.#visionRadius;
  }

  set visionRadius(visionRadius: number) {
    this.#visionRadius = visionRadius;
  }

  set exploredAreas(exploredAreas: GridPosition[]) {
    this.#exploredAreas = exploredAreas;
  }

  get exploredAreas(): GridPosition[] {
    return this.#exploredAreas;
  }

  get exploredMask(): HTMLCanvasElement | null {
    return this.#exploredMask;
  }

  /**
   * Invalidate the explored mask so it will be rebuilt on next access.
   * Call when map data, grid size, or walls change.
   */
  clearExploredMask(): void {
    this.#exploredMask = null;
  }

  /**
   * Rebuild the entire explored mask from scratch using all explored areas.
   * Used when the mask is invalidated (map change, resize, etc.).
   */
  rebuildExploredMask(): void {
    this.#exploredMask = null;
    if (this.#exploredAreas.length === 0) return;
    const mapSize = this.#vtt.backgroundImageSize;
    if (mapSize.width === 0 || mapSize.height === 0) return;

    const mask = document.createElement("canvas");
    mask.width = mapSize.width;
    mask.height = mapSize.height;
    const maskCtx = mask.getContext("2d");
    if (!maskCtx) return;
    const walls = this.collectVisionWalls();
    const visionRadiusPx = this.#visionRadius * this.#vtt.gridSize.width;
    const maxLOSRadius = Math.sqrt(
      mapSize.width * mapSize.width + mapSize.height * mapSize.height
    );
    const allLights = this.collectAllLights();
    for (const area of this.#exploredAreas) {
      const centerX = (area.col + 0.5) * this.#vtt.gridSize.width;
      const centerY = (area.row + 0.5) * this.#vtt.gridSize.height;
      const origin = { x: centerX, y: centerY };
      this.paintExploredVision(
        maskCtx,
        origin,
        walls,
        visionRadiusPx,
        maxLOSRadius,
        allLights,
        mapSize.width,
        mapSize.height
      );
    }
    this.#exploredMask = mask;
  }
  get gridPosition(): GridPosition | null {
    return this.#gridPosition;
  }

  set gridPosition(gridPosition: GridPosition | null) {
    this.#gridPosition = gridPosition;
  }

  get cell(): Cell | null {
    if (!this.#gridPosition) {
      return null;
    }
    return this.#vtt.grid.cells[this.#gridPosition?.row]?.[
      this.#gridPosition?.col
    ];
  }

  set cell(cell: Cell | null) {
    if (!cell) {
      this.#gridPosition = null;
      return;
    }
    this.#gridPosition = { row: cell.row, col: cell.col };
    const isNew = !this.#exploredAreas.some(
      (area) => area.row === cell.row && area.col === cell.col
    );
    if (isNew) {
      this.#exploredAreas.push(this.#gridPosition);
      this.updateExploredMask();
    }
  }

  /**
   * Silently record a grid position as explored without rebuilding the mask.
   * Used during animation to batch explored area updates cheaply.
   */
  addExploredArea(pos: GridPosition): void {
    const isNew = !this.#exploredAreas.some(
      (area) => area.row === pos.row && area.col === pos.col
    );
    if (isNew) {
      this.#exploredAreas.push({ row: pos.row, col: pos.col });
    }
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


  set animationPosition(position: Coordinates | null) {
    this.#animationPosition = position;
  }

  get animationPosition(): Coordinates | null {
    return this.#animationPosition;
  }

  private getTempPositions(): (Coordinates | null)[] {
    const positions: (Coordinates | null)[] = [
      ...this.#tempPositions,
      this.tempPosition,
    ];
    if (this.cell) {
      positions.unshift({
        x: this.cell.col * this.width,
        y: this.cell.row * this.height,
      });
    }
    return positions;
  }

  addTempPosition(position: Coordinates) {
    this.#tempPositions.push(position);
  }

  /**
   * Returns the intermediate waypoint grid positions (from ctrl+click).
   * Does NOT include the unit's current position or the final drop position.
   */
  getTempWaypoints(): GridPosition[] {
    return this.#tempPositions.map((pos) => ({
      row: Math.round(pos.y / this.height),
      col: Math.round(pos.x / this.width),
    }));
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
    const movementWalls = this.collectMovementWalls();
    let numberOfDiagonalMoves = 0;
    let totalDistance = 0;
    ctx.save();
    positions.forEach((position, index) => {
      if (!position) {
        return;
      }
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

        // Check if this segment crosses any movement-blocking walls
        const intersections = segmentIntersectsWalls(
          oldCenter,
          center,
          movementWalls
        );
        const crossesWall = intersections.length > 0;

        // Draw the path segment
        ctx.beginPath();
        ctx.strokeStyle = crossesWall
          ? "rgba(255,80,80,0.9)"
          : "rgba(255,255,255,0.75)";
        ctx.moveTo(oldCenter.x, oldCenter.y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
        // Draw circle at the start of the segment
        ctx.beginPath();
        ctx.fillStyle = crossesWall
          ? "rgba(255,0,0,0.5)"
          : "rgba(0,0,255,0.5)";
        ctx.arc(
          oldCenter.x,
          oldCenter.y,
          Math.min(this.width, this.height) / 5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw X markers at each wall intersection point
        if (crossesWall) {
          const markerSize = Math.min(this.width, this.height) / 4;
          ctx.save();
          ctx.strokeStyle = "rgba(255,0,0,0.95)";
          ctx.lineWidth = 3;
          for (const hit of intersections) {
            ctx.beginPath();
            ctx.moveTo(hit.x - markerSize, hit.y - markerSize);
            ctx.lineTo(hit.x + markerSize, hit.y + markerSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(hit.x + markerSize, hit.y - markerSize);
            ctx.lineTo(hit.x - markerSize, hit.y + markerSize);
            ctx.stroke();
          }
          ctx.restore();
        }
        // Draw distance text at the center of the line
        const { numberOfFeet, diagonalMoves } = get5eDistance(
          oldCenter,
          center,
          this.#vtt.gridSize,
          5,
          numberOfDiagonalMoves % 2 === 1
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
        // Save the current canvas state
        ctx.save();
        // Translate to midpoint and rotate
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        if (Math.abs(angle) > Math.PI / 2 || Math.abs(angle) < -Math.PI / 2) {
          ctx.rotate(Math.PI);
        }
        // Draw distance text
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${numberOfFeet} ft`, 0, 0);
        ctx.restore();
      }
      if (positions.length > 1) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,255,0.5)";
        ctx.arc(
          center.x,
          center.y,
          Math.min(this.width, this.height) / 5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Draw the total distance at the end of the path
      if (index === positions.length - 1 && totalDistance > 0) {
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

  get owner(): string {
    return this.#owner;
  }

  set owner(owner: string) {
    this.#owner = owner;
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    position?: Coordinates | null
  ) {
    const { gridSize } = this.#vtt;
    const width = gridSize.width;
    const height = gridSize.height;

    if (!position && this.#animationPosition) {
      position = this.#animationPosition;
    } else if (!position && this.cell) {
      position = {
        x: this.cell.col * width,
        y: this.cell.row * height,
      };
    }

    if (!position) {
      return;
    }

    const { x, y } = position;

    if (
      this.owner === this.vtt.websocketClientId ||
      this.vtt.websocketClientId === null
    ) {
      ctx.fillStyle = this.vtt.userColor;
    } else {
      ctx.fillStyle = "green";
    }
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

  /**
   * Collect all vision-blocking wall segments from the current map data.
   */
  private collectVisionWalls(): Wall[] {
    const mapData = this.#vtt.mapData;
    if (!mapData) return [];
    return [
      ...mapData.walls.filter((w) => w.blocksVision),
      ...mapData.doors
        .filter((door) => door.blocksVision && !door.isOpen)
        .map((door) => ({
          start: door.start,
          end: door.end,
          blocksMovement: true,
          blocksVision: door.blocksVision,
        })),
    ];
  }


  /**
   * Collect all movement-blocking wall segments from the current map data.
   * Includes walls with blocksMovement and closed doors.
   */
  private collectMovementWalls(): Wall[] {
    const mapData = this.#vtt.mapData;
    if (!mapData) return [];
    return [
      ...mapData.walls.filter((w) => w.blocksMovement),
      ...mapData.doors
        .filter((door) => !door.isOpen)
        .map((door) => ({
          start: door.start,
          end: door.end,
          blocksMovement: true,
          blocksVision: door.blocksVision,
        })),
    ];
  }
  /**
   * Update the explored mask by adding the light-aware visible area from the current position.
   * Called when the unit moves to a new cell.
   */
  private updateExploredMask(): void {
    if (!this.#gridPosition) return;
    const mapSize = this.#vtt.backgroundImageSize;
    if (mapSize.width === 0 || mapSize.height === 0) return;
    if (!this.#exploredMask) {
      this.#exploredMask = document.createElement("canvas");
      this.#exploredMask.width = mapSize.width;
      this.#exploredMask.height = mapSize.height;
    }
    const ctx = this.#exploredMask.getContext("2d");
    if (!ctx) return;
    const visionRadiusPx = this.#visionRadius * this.#vtt.gridSize.width;
    const maxLOSRadius = Math.sqrt(
      mapSize.width * mapSize.width + mapSize.height * mapSize.height
    );
    const allLights = this.collectAllLights();
    const walls = this.collectVisionWalls();
    const centerX = (this.#gridPosition.col + 0.5) * this.#vtt.gridSize.width;
    const centerY = (this.#gridPosition.row + 0.5) * this.#vtt.gridSize.height;
    const origin = { x: centerX, y: centerY };
    this.paintExploredVision(
      ctx,
      origin,
      walls,
      visionRadiusPx,
      maxLOSRadius,
      allLights,
      mapSize.width,
      mapSize.height
    );
  }

  /**
   * Paint the light-aware visible area from a given origin onto a mask canvas.
   * Uses the same algorithm as renderUnitVision:
   *   visible area = full LOS polygon ∩ (darkvision circle ∪ visible light circles)
   */
  private paintExploredVision(
    maskCtx: CanvasRenderingContext2D,
    origin: Coordinates,
    walls: Wall[],
    visionRadiusPx: number,
    maxLOSRadius: number,
    allLights: Light[],
    mapWidth: number,
    mapHeight: number
  ): void {
    // Compute full LOS polygon (wall-occluded, map-diagonal range)
    const fullLOSPolygon = computeVisibilityPolygon(
      origin,
      walls,
      maxLOSRadius
    );
    if (fullLOSPolygon.length < 3) return;

    // Filter visible lights: only those whose center is within the unit's LOS
    const visibleLights = allLights.filter((light) => {
      const lightRadiusPx = Math.max(light.bright, light.dim);
      if (lightRadiusPx <= 0) return false;
      return this.isPointInPolygon(light.position, fullLOSPolygon);
    });

    // Build visible area on a temporary canvas using compositing:
    // visible area = full LOS polygon ∩ (darkvision circle ∪ light circles)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = mapWidth;
    tempCanvas.height = mapHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Step 1: Draw the vision mask (darkvision circle + light circles)
    tempCtx.fillStyle = "white";

    // Darkvision circle
    tempCtx.beginPath();
    tempCtx.arc(origin.x, origin.y, visionRadiusPx, 0, Math.PI * 2);
    tempCtx.fill();

    // Add each visible light's area
    for (const light of visibleLights) {
      const lightRadiusPx = Math.max(light.bright, light.dim);
      tempCtx.beginPath();
      tempCtx.arc(
        light.position.x,
        light.position.y,
        lightRadiusPx,
        0,
        Math.PI * 2
      );
      tempCtx.fill();
    }

    // Step 2: Intersect with full LOS polygon
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.beginPath();
    tempCtx.moveTo(fullLOSPolygon[0].x, fullLOSPolygon[0].y);
    for (let i = 1; i < fullLOSPolygon.length; i++) {
      tempCtx.lineTo(fullLOSPolygon[i].x, fullLOSPolygon[i].y);
    }
    tempCtx.closePath();
    tempCtx.fill();

    // Step 3: Add the result to the explored mask (source-over accumulates)
    maskCtx.drawImage(tempCanvas, 0, 0);
  }

  /**
   * Collect all light sources: map-placed lights + unit-emitted lights.
   * Map lights have bright/dim already in pixels.
   * Unit lights from toLight() have bright/dim in grid cells — convert to pixels.
   */
  private collectAllLights(): Light[] {
    const mapData = this.#vtt.mapData;
    if (!mapData) return [];

    const mapLights = mapData.lights ?? [];

    const unitLights = this.#vtt.units
      .filter((unit) => unit.gridPosition !== null)
      .map((unit) => {
        const light = unit.toLight();
        light.bright = light.bright * this.#vtt.gridSize.width;
        light.dim = light.dim * this.#vtt.gridSize.width;
        return light;
      });

    return [...mapLights, ...unitLights];
  }

  /**
   * Test if a point is inside a polygon using the ray-casting algorithm.
   */
  private isPointInPolygon(
    point: Coordinates,
    polygon: Coordinates[]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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
      owner: this.#owner,
    };
    return JSON.stringify(createProps);
  }

  toLight(): Light {
    const light: Light = {
      position: this.gridPosition
        ? {
            x: this.gridPosition.col * this.vtt.gridSize.width + this.width / 2,
            y:
              this.gridPosition.row * this.vtt.gridSize.height +
              this.height / 2,
          }
        : { x: 0, y: 0 },
      bright: this.visionRadius,
      dim: this.visionRadius,
      tintAlpha: 1,
      tintColor: "#FFFFFF",
    };
    return light;
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
