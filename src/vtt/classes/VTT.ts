import { KeyboardHandler } from "@/vtt/input/KeyboardHandler";
import { MouseHandler } from "@/vtt/input/MouseHandler";
// import { renderFogOfWar } from "@/vtt/renderFunctions/renderFogOfWar";
// import { renderFullscreenImage } from "@/vtt/renderFunctions/renderFullscreenImage";
// import { renderUnitVision } from "@/vtt/renderFunctions/renderUnitVision";
import { Coordinates, GridPosition, Size } from "@/vtt/types/types";
import { Cell } from "@/vtt/classes/Cell";
import { Grid } from "@/vtt/classes/Grid";
import Unit from "@/vtt/classes/Unit";
import { postMoveUnit } from "@/api/postMoveUnit";
import { BaseClass } from "@/vtt/classes/BaseClass";
import { postAddUnit } from "@/api/postAddUnit";
import { postRemoveUnit } from "@/api/postRemoveUnit";
import { renderWalls } from "../renderFunctions/renderWalls";
import { renderDoors } from "../renderFunctions/renderDoors";
import { renderLightsWithWalls } from "../renderFunctions/renderLightsWithWalls";
import { timeFunction } from "@/util/timeFunction";
import { MapData } from "../types/mapData/MapData";

interface VTTProps {
  websocketChannel: string;
}

export type CanvasKey = "background" | "foreground";
export type RenderConditions = Record<CanvasKey, boolean>;

export class VTT extends BaseClass {
  #websocketChannel: string;
  #websocketClientId: string | null;
  #canvas: Record<CanvasKey, HTMLCanvasElement>;
  #ctx: Record<CanvasKey, CanvasRenderingContext2D>;
  #renderConditions: RenderConditions;
  #hud: HTMLDivElement;
  #gridSize: Size;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #loading: boolean;
  #isDebug: boolean;
  #mouseHandler: MouseHandler | null;
  #keyboardHandler: KeyboardHandler | null;
  #backgroundImage: HTMLImageElement | null;
  #backgroundImageSize: Size;
  #position: Coordinates;
  #tempPosition: Coordinates | null;
  #mousePosition: Coordinates;
  #gridColor: string;
  #gridXOffset: number;
  #gridYOffset: number;
  #grid: Grid;
  #units: Unit[];
  #selectedUnits: Unit[] = [];
  #mapData: MapData | null;
  #lightingCanvas: OffscreenCanvas | null;

  userColor: string;

  initialized = false;

  constructor({ websocketChannel }: VTTProps) {
    super();
    this.#isDebug = false;
    this.#mapData = null;
    this.#websocketChannel = websocketChannel;
    this.#websocketClientId = null;
    this.#hud = document.getElementById("hud") as HTMLDivElement;
    this.#canvas = {
      background: document.createElement("canvas"),
      foreground: document.createElement("canvas"),
    };
    this.#ctx = {
      background: this.#canvas.background.getContext(
        "2d"
      ) as CanvasRenderingContext2D,
      foreground: this.#canvas.foreground.getContext(
        "2d"
      ) as CanvasRenderingContext2D,
    };
    this.#gridSize = { width: 50, height: 50 };
    this.#gridColor = "#989898";
    this.#gridXOffset = 0;
    this.#gridYOffset = 0;
    this.#zoom = 1;
    this.#windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#animationFrameId = 0;
    this.#renderConditions = {
      background: false,
      foreground: false,
    };
    this.#position = { x: 0, y: 0 };
    this.#tempPosition = null;
    this.#mousePosition = { x: 0, y: 0 };
    this.#loading = true;
    this.#backgroundImage = new Image();
    this.#backgroundImageSize = { width: 0, height: 0 };
    this.#backgroundImage.onload = () => this.onImageLoad();
    this.#mouseHandler = null;
    this.#keyboardHandler = null;
    this.#units = [];
    this.#grid = new Grid(this, 10, 10);
    this.userColor = "#00FF00";
    this.#lightingCanvas = null;

    this.init();

    window.addEventListener("resize", () => this.onResize());
  }

  destroy() {
    cancelAnimationFrame(this.#animationFrameId);
    this.#mouseHandler?.destroy();
    this.#keyboardHandler?.destroy();
    window.removeEventListener("resize", () => this.onResize());
  }

  /**
   * Getters
   */

  get gridXOffset() {
    return this.#gridXOffset;
  }

  get gridYOffset() {
    return this.#gridYOffset;
  }

  get gridColor() {
    return this.#gridColor;
  }

  get canvas() {
    return this.#canvas;
  }

  get grid() {
    return this.#grid;
  }

  get mousePosition() {
    return this.#mousePosition;
  }

  get pressedKeys() {
    return this.#keyboardHandler?.pressedKeys;
  }

  get tempPosition() {
    return this.#tempPosition;
  }

  get backgroundImageSize() {
    return this.#backgroundImageSize;
  }

  get ctx() {
    return this.#ctx;
  }

  get gridSize() {
    return this.#gridSize;
  }

  get position() {
    return this.#position;
  }

  get units() {
    return this.#units;
  }

  get isDebug() {
    return this.#isDebug;
  }

  /** Get the position that should be used for rendering */
  getPosition() {
    return this.tempPosition || this.#position;
  }

  get zoom() {
    return this.#zoom;
  }

  get windowSize() {
    return this.#windowSize;
  }

  get selectedUnits() {
    return this.#selectedUnits;
  }

  get websocketChannel() {
    return this.#websocketChannel;
  }

  get websocketClientId() {
    return this.#websocketClientId;
  }

  get mapData() {
    return this.#mapData;
  }

  get lightingCanvas() {
    return this.#lightingCanvas;
  }

  /**
   * Setters
   */

  set gridXOffset(offset: number) {
    this.#gridXOffset = offset;
    this.render("background");
  }

  set gridYOffset(offset: number) {
    this.#gridYOffset = offset;
    this.render("background");
  }

  set gridColor(color: string) {
    this.#gridColor = color;
    this.render("background");
  }

  set windowSize(size: { width: number; height: number }) {
    this.#windowSize = size;
  }

  set mousePosition(position: Coordinates) {
    this.#mousePosition = position;
  }

  set backgroundImage(url: string) {
    this.#backgroundImage = new Image();
    this.#backgroundImage.src = url;
    this.#backgroundImageSize = { width: 0, height: 0 };
    this.#loading = true;
    this.#backgroundImage.onload = () => this.onImageLoad();
  }

  set gridSize(size: Size) {
    this.#gridSize = size;
    this.resizeGrid();
  }

  set position(position: Coordinates) {
    this.#position = position;
  }

  set tempPosition(position: Coordinates | null) {
    this.#tempPosition = position;
  }

  set zoom(zoom: number) {
    if (this.#zoom === zoom) return;
    this.#zoom = zoom;
  }

  set selectedUnits(units: Unit[]) {
    this.#selectedUnits = units;
    this.render("foreground");
  }

  set websocketClientId(clientId: string | null) {
    if (clientId) {
      this.units.forEach((unit) => {
        if (unit.owner === this.#websocketClientId) {
          unit.owner = clientId;
        }
      });
    }
    this.#websocketClientId = clientId;
  }

  set mapData(data: MapData | null) {
    this.#mapData = data;
  }

  set lightingCanvas(canvas: OffscreenCanvas | null) {
    this.#lightingCanvas = canvas;
  }

  /**
   * Private methods
   */

  private resizeGrid() {
    this.#backgroundImageSize = this.mapData?.size || {
      width: this.#backgroundImage?.naturalWidth || 0,
      height: this.#backgroundImage?.naturalHeight || 0,
    };

    this.resizeCanvases();
    const numberOfColumns = Math.ceil(
      this.#backgroundImageSize.width / this.#gridSize.width
    );
    const numberOfRows = Math.ceil(
      this.#backgroundImageSize.height / this.#gridSize.height
    );
    this.#grid.populateGrid(numberOfColumns, numberOfRows);
    this.renderAll();
  }

  private resizeCanvases() {
    Object.keys(this.canvas).forEach((key) => {
      const canvas = this.canvas[key as CanvasKey];
      if (!canvas) {
        return;
      }
      canvas.width = this.#backgroundImageSize.width;
      canvas.height = this.#backgroundImageSize.height;
    });
    this.#lightingCanvas = null;
  }

  private onImageLoad() {
    this.#zoom = 1;
    this.resizeGrid();
    this.#loading = false;
  }

  private onResize() {
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
  }

  private clearCanvas(key: CanvasKey) {
    if (!this.#ctx[key]) {
      return;
    }
    this.#ctx[key].clearRect(
      0,
      0,
      this.canvas[key].width,
      this.canvas[key].height
    );
  }

  private async renderLoop() {
    if (!this.canvas) {
      return;
    }
    if (this.#loading) {
      // this.clearCanvas("foreground");
      this.ctx.foreground.fillStyle = "black";
      this.ctx.foreground.font = "48px Arial";
      this.ctx.foreground.textAlign = "center";
      this.ctx.foreground.fillText(
        "Loading...",
        this.canvas.foreground.width / 2,
        this.canvas.foreground.height / 2
      );
      const id = requestAnimationFrame(() => this.renderLoop());
      this.#animationFrameId = id;
      return;
    }

    if (this.#hud) {
      this.#hud.style.top = `${this.getPosition().y}px`;
      this.#hud.style.left = `${this.getPosition().x}px`;
      this.#hud.style.transform = `scale(${this.#zoom})`;
    } else {
      this.#hud = document.getElementById("hud") as HTMLDivElement;
    }

    if (this.#renderConditions.background) {
      timeFunction("Render Background", () => {
        this.#renderConditions.background = false;
        this.clearCanvas("background");
        const ctx = this.#ctx.background;
        const canvas = this.canvas.background;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (this.#backgroundImage) {
          ctx.drawImage(this.#backgroundImage, 0, 0);
        }
        // renderFullscreenImage(this, "background", this.#backgroundImage!);
        this.#grid.draw();

        renderWalls(this);
        renderDoors(this);
        timeFunction("Render Lights", () => renderLightsWithWalls(this));
        // this.units.forEach((unit) => renderFogOfWar(unit));
        // renderUnitVision(this);
      });
    }
    if (this.#renderConditions.foreground) {
      timeFunction("Render Foreground", () => {
        this.#renderConditions.foreground = false;
        this.clearCanvas("foreground");
        this.grid.drawForeground();
        this.#units.forEach((unit) => unit.draw());
        if (this.isDebug) {
          this.ctx.foreground.fillStyle = "white";
          this.ctx.foreground.font = "24px Arial";
          this.ctx.foreground.textAlign = "center";
          this.ctx.foreground.fillText(
            `VTT: ${this.id} - ${this.#units.length} units`,
            this.canvas.foreground.width / 2,
            24
          );
        }
      });
    }

    const id = requestAnimationFrame(() => this.renderLoop());
    this.#animationFrameId = id;
  }

  private centerCanvasOnUnit(unit: Unit) {
    const cell = unit.cell;
    if (cell) {
      const centeredX = cell.col * this.gridSize.width;
      const centeredY = cell.row * this.gridSize.height;
      const cellPosition = {
        x: centeredX,
        y: centeredY,
      };
      const cellCenteredOnScreen = {
        x: this.windowSize.width / 2 - cellPosition.x,
        y: this.windowSize.height / 2 - cellPosition.y,
      };
      this.position = cellCenteredOnScreen;
    }
  }

  /**
   * Public methods
   */
  init() {
    let canvasFound = true;
    Object.keys(this.canvas).forEach((key) => {
      const canvas = document.getElementById(key);
      if (!canvas) {
        canvasFound = false;
      } else {
        this.#canvas[key as CanvasKey] = canvas as HTMLCanvasElement;
        this.#ctx[key as CanvasKey] = this.#canvas[key as CanvasKey].getContext(
          "2d"
        ) as CanvasRenderingContext2D;
      }
    });
    if (!canvasFound) return;
    this.initialized = true;
    this.#lightingCanvas = null;
    this.#isDebug = window.location.host.includes("localhost");
    if (this.#mouseHandler === null) {
      this.#mouseHandler = new MouseHandler(this);
      this.#mouseHandler.init();
    }
    if (this.#keyboardHandler === null) {
      this.#keyboardHandler = new KeyboardHandler(this);
      this.#keyboardHandler.init();
    }
    this.resizeCanvases();

    this.#units
      .filter((unit) => unit.owner === this.websocketClientId)
      .forEach((unit) => this.removeUnit(unit, true));
    this.#units = [];

    this.renderAll();
    this.renderLoop();
  }

  render(canvas: CanvasKey) {
    this.#renderConditions[canvas] = true;
  }

  renderAll() {
    const renderConditions: Record<CanvasKey, boolean> = {
      background: true,
      foreground: true,
    };
    this.#renderConditions = renderConditions;
  }

  selectUnit(unit: Unit, append: boolean) {
    if (!append) {
      this.deselectAllUnits();
    }
    this.#selectedUnits.push(unit);
    this.render("foreground");
  }

  deselectUnit(unit: Unit) {
    this.#selectedUnits = this.#selectedUnits.filter((u) => u.id !== unit.id);
    if (this.#selectedUnits.length === 0) {
      this.#mouseHandler?.clearMoveUnitStartCoordinates();
    }
    this.render("foreground");
  }

  deselectAllUnits() {
    if (this.#selectedUnits.length === 0) return;
    this.#selectedUnits = [];
    this.render("foreground");
  }

  addUnit(unit: Unit, destination: GridPosition | null, broadcast = false) {
    const duplicate = this.units.find((u) => u.id === unit.id);

    if (duplicate) {
      duplicate.gridPosition = destination;
      return;
    }

    unit.vtt = this;
    unit.gridPosition = destination;
    this.#units.push(unit);
    this.render("foreground");

    if (!destination && this.#mouseHandler) {
      this.#mouseHandler.placeNewUnit = unit;
    }

    if (
      destination &&
      broadcast &&
      this.websocketChannel &&
      this.websocketClientId
    ) {
      postAddUnit({
        unit: unit,
        destination: {
          row: destination.row,
          col: destination.col,
        },
        channelId: this.websocketChannel,
        author: this.websocketClientId,
      });
    }
  }

  removeUnit(unit: Unit, broadcast = false) {
    this.#units = this.#units.filter((u) => u.id !== unit.id);
    this.render("foreground");

    if (broadcast && this.websocketChannel && this.websocketClientId) {
      postRemoveUnit({
        unit: unit,
        channelId: this.websocketChannel,
        author: this.websocketClientId,
      });
    }
  }

  moveUnit(unit: Unit, to: Cell, broadcast = false): void {
    if (!to) {
      return;
    }
    unit.tempPosition = null;
    unit.cell = to;
    this.renderAll();

    if (broadcast && this.websocketChannel && this.websocketClientId) {
      postMoveUnit({
        unit: unit,
        destination: {
          row: to.row,
          col: to.col,
        },
        channelId: this.websocketChannel,
        author: this.websocketClientId,
      });
    }
  }
}
