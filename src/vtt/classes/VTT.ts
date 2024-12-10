import { generateGuid } from "@/util/generateGuid";
import { KeyboardHandler } from "../input/KeyboardHandler";
import { MouseHandler } from "../input/MouseHandler";
import { renderFogOfWar } from "../renderFunctions/renderFogOfWar";
import { renderFullscreenImage } from "../renderFunctions/renderFullscreenImage";
import { renderOffScreenCanvas } from "../renderFunctions/renderOffScreenCanvas";
import { renderUnitVision } from "../renderFunctions/renderUnitVision";
import { Coordinates, Size } from "../types/types";
import { Cell } from "./Cell";
import { Grid } from "./Grid";
import Unit from "./Unit";
import { postMoveUnit } from "@/api/postMoveUnit";
import { BaseClass } from "./BaseClass";

export class VTT extends BaseClass {
  #websocketChannel: string;
  #websocketClientId: string;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #offScreenCanvas: HTMLCanvasElement;
  #offScreenCtx: CanvasRenderingContext2D;
  #gridSize: Size;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #loading: boolean;
  #isDebug: boolean;
  #mouseHandler: MouseHandler;
  #keyboardHandler: KeyboardHandler;
  #renderConditions: {
    background: boolean;
    foreground: boolean;
  };
  #backgroundImage: HTMLImageElement | null;
  #backgroundImageSize: Size;
  #backgroundImageSizeNatural: Size;
  #position: Coordinates;
  #tempPosition: Coordinates | null;
  #mousePosition: Coordinates;
  #gridColor: string;
  #gridXOffset: number;
  #gridYOffset: number;
  #grid: Grid;
  #units: Unit[];
  #selectedUnits: Unit[] = [];

  constructor(canvasId: string, websocketChannel: string) {
    super();
    this.#websocketChannel = websocketChannel;
    this.#websocketClientId = `unset-${generateGuid()}`;
    this.#canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.#ctx = this.#canvas?.getContext("2d") as CanvasRenderingContext2D;
    this.#isDebug = false;
    this.#offScreenCanvas = document.createElement("canvas");
    this.#offScreenCtx = this.#offScreenCanvas?.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
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
    this.#backgroundImageSizeNatural = { width: 0, height: 0 };
    this.#backgroundImage.onload = () => this.onImageLoad();
    this.#mouseHandler = new MouseHandler(this);
    this.#keyboardHandler = new KeyboardHandler(this);
    this.#units = [];
    this.#grid = new Grid(this, 10, 10);

    this.init();

    window.addEventListener("resize", () => this.onResize());
  }

  destroy() {
    cancelAnimationFrame(this.#animationFrameId);
    this.#mouseHandler.destroy();
    this.#keyboardHandler.destroy();
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

  get offScreenCanvas() {
    return this.#offScreenCanvas;
  }

  get grid() {
    return this.#grid;
  }

  get mousePosition() {
    return this.#mousePosition;
  }

  get pressedKeys() {
    return this.#keyboardHandler.pressedKeys;
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

  get offScreenCtx() {
    return this.#offScreenCtx;
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

  /**
   * Setters
   */

  set canvas(canvas: HTMLCanvasElement) {
    this.#canvas = canvas;
    this.#ctx = this.#canvas.getContext("2d") as CanvasRenderingContext2D;
    this.#mouseHandler.destroy();
    this.#mouseHandler = new MouseHandler(this);
    this.#mouseHandler.init();
    this.#keyboardHandler.destroy();
    this.#keyboardHandler = new KeyboardHandler(this);
    this.#keyboardHandler.init();
    this.setCanvasSize();
    this.shouldRenderAll = true;
  }

  set shouldRenderBackground(render: boolean) {
    this.#renderConditions.background = render;
  }

  set shouldRenderForeground(render: boolean) {
    this.#renderConditions.foreground = render;
  }

  set shouldRenderAll(render: boolean) {
    this.shouldRenderBackground = render;
    this.shouldRenderForeground = render;
  }

  set gridXOffset(offset: number) {
    this.#gridXOffset = offset;
    this.shouldRenderAll = true;
  }

  set gridYOffset(offset: number) {
    this.#gridYOffset = offset;
    this.shouldRenderAll = true;
  }

  set gridColor(color: string) {
    this.#gridColor = color;
    this.shouldRenderAll = true;
  }

  set windowSize(size: { width: number; height: number }) {
    this.#windowSize = size;
    this.setCanvasSize();
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
    this.shouldRenderForeground = true;
  }

  set tempPosition(position: Coordinates | null) {
    this.#tempPosition = position;
    if (position !== null) {
      this.shouldRenderForeground = true;
    }
  }

  set zoom(zoom: number) {
    if (this.#zoom === zoom) return;
    this.#zoom = zoom;
    this.shouldRenderForeground = true;
  }

  set selectedUnits(units: Unit[]) {
    this.#selectedUnits = units;
    this.shouldRenderAll = true;
  }

  set websocketClientId(clientId: string) {
    this.#websocketClientId = clientId;
  }

  /**
   * Private methods
   */

  private resizeGrid() {
    this.#backgroundImageSizeNatural = {
      width: this.#backgroundImage?.naturalWidth || 0,
      height: this.#backgroundImage?.naturalHeight || 0,
    };

    this.#backgroundImageSize = {
      width: this.#backgroundImage?.naturalWidth || 0,
      height: this.#backgroundImage?.naturalHeight || 0,
    };

    this.#offScreenCanvas.width = this.#backgroundImageSize.width;
    this.#offScreenCanvas.height = this.#backgroundImageSize.height;

    const numberOfColumns = Math.ceil(
      this.#backgroundImageSizeNatural.width / this.#gridSize.width
    );
    const numberOfRows = Math.ceil(
      this.#backgroundImageSizeNatural.height / this.#gridSize.height
    );
    this.#grid.populateGrid(numberOfColumns, numberOfRows);
    this.shouldRenderAll = true;
  }

  private onImageLoad() {
    this.resizeGrid();

    this.#zoom = 1;
    this.shouldRenderAll = true;
    this.#loading = false;
  }

  private onResize() {
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.shouldRenderForeground = true;
  }

  private setCanvasSize() {
    if (!this.#canvas) {
      console.warn("Canvas not found - setCanvasSize");
      return;
    }
    this.#canvas.width = this.#windowSize.width;
    this.#canvas.height = this.#windowSize.height;
    this.shouldRenderForeground = true;
  }

  private async renderLoop() {
    if (!this.canvas) {
      console.warn("Canvas not found - renderLoop");
      return;
    }
    if (this.#loading) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "black";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Loading...",
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      const id = requestAnimationFrame(() => this.renderLoop());
      this.#animationFrameId = id;
      return;
    }
    if (this.#renderConditions.background) {
      this.#renderConditions.background = false;
      this.#offScreenCtx.clearRect(
        0,
        0,
        this.#offScreenCanvas.width,
        this.#offScreenCanvas.height
      );
      this.#offScreenCtx.fillStyle = "black";
      this.#offScreenCtx.fillRect(
        0,
        0,
        this.#offScreenCanvas.width,
        this.#offScreenCanvas.height
      );

      if (this.#backgroundImage?.complete) {
        renderFullscreenImage(this, this.#backgroundImage);
      }
      this.#grid.draw();
      this.units.forEach((unit) => renderFogOfWar(unit));
      this.#units.forEach((unit) => unit.draw());
      renderUnitVision(this);
    }
    if (this.#renderConditions.foreground) {
      this.#renderConditions.foreground = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#36454f";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      renderOffScreenCanvas(this);
      if (this.#isDebug) {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, 75);
        this.ctx.textAlign = "center";
        this.ctx.font = "48px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText(
          `zoom: ${this.zoom.toFixed(2)} | position: ${this.position.x.toFixed(
            1
          )}, ${this.position.y.toFixed(1)}`,
          this.canvas.width / 2,
          50
        );
      }
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
    if (!this.#canvas) {
      console.warn("Canvas not found - init");
      return;
    }
    this.setCanvasSize();
    this.#units = [
      new Unit({
        vtt: this,
        maxHealth: 100,
        name: "Sir Lancelot",
        type: "unit",
        gridPosition: {
          row: Math.floor(Math.random() * (this.grid?.cells?.length ?? 0)),
          col: Math.floor(Math.random() * (this.grid?.cells?.[0]?.length ?? 0)),
        },
      }),
    ];
    this.selectUnit(this.units[0], false);
    this.centerCanvasOnUnit(this.units[0]);
    this.renderLoop();
  }

  selectUnit(unit: Unit, append: boolean) {
    if (!append) {
      this.deselectAllUnits();
    }
    this.#selectedUnits.push(unit);
    this.shouldRenderAll = true;
  }

  deselectUnit(unit: Unit) {
    this.#selectedUnits = this.#selectedUnits.filter((u) => u.id !== unit.id);
    this.shouldRenderAll = true;
  }

  deselectAllUnits() {
    if (this.#selectedUnits.length === 0) return;
    this.#selectedUnits = [];
    this.shouldRenderAll = true;
  }

  moveUnit(unit: Unit, to: Cell, broadcast = false): void {
    if (!to) {
      console.warn("Destination cell not found");
      return;
    }
    unit.tempPosition = null;
    unit.cell = to;
    this.shouldRenderAll = true;

    if (broadcast) {
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
