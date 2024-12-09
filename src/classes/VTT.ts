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

export class VTT {
  #id: number;
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

  constructor(canvasId: string, backgroundImageUrl: string) {
    this.#id = Math.floor(Math.random() * 1000000);
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
      background: true,
      foreground: true,
    };
    this.#position = { x: 0, y: 0 };
    this.#tempPosition = null;
    this.#mousePosition = { x: 0, y: 0 };
    this.#loading = true;
    this.#backgroundImage = new Image();
    this.#backgroundImage.src = backgroundImageUrl;
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
    if (this.#renderConditions.background) {
      console.log("render offscreen canvas");
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
      renderOffScreenCanvas(this);
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
    const id = requestAnimationFrame(() => this.renderLoop());
    this.#animationFrameId = id;
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
          row: Math.floor(Math.random() * this.grid.cells.length),
          col: Math.floor(Math.random() * this.grid.cells[0].length),
        },
      }),
    ];
    this.selectUnit(this.units[0], false);
    const cell = this.units[0].cell;
    // if (cell) {
    //   const centeredX = -cell.x;
    //   const centeredY = -cell.y;
    //   const cellPosition = {
    //     x: centeredX,
    //     y: centeredY,
    //   };
    //   this.position = cellPosition;
    // }
    this.renderLoop();
  }

  moveUnit(unit: Unit, to: Cell): void {
    if (!to) {
      console.warn("Destination cell not found");
      return;
    }
    unit.tempPosition = null;
    unit.cell = to;
    this.shouldRenderAll = true;
  }
}
