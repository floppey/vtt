import { MouseHandler } from "../input/MouseHandler";
import { Coordinates, Size } from "../types/types";
import { Cell } from "./Cell";
import { Grid } from "./Grid";
import Unit from "./Unit";

export class VTT {
  #id: number;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #gridSize: Size;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #loading: boolean;
  #mouseHandler: MouseHandler;
  #shouldRender: boolean;
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
    this.#gridSize = { width: 50, height: 50 };
    this.#gridColor = "#989898";
    this.#gridXOffset = 0;
    this.#gridYOffset = 0;

    this.#zoom = 1;
    this.#windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#animationFrameId = 0;
    this.#shouldRender = true;
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
    this.#units = [];
    this.#grid = new Grid(this, 10, 10);

    this.init();

    window.addEventListener("resize", () => this.onResize());
  }

  destroy() {
    cancelAnimationFrame(this.#animationFrameId);
    this.#mouseHandler.destroy();
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
    this.setCanvasSize();
    this.#shouldRender = true;
  }

  set shouldRender(value: boolean) {
    this.#shouldRender = value;
  }

  set gridXOffset(offset: number) {
    this.#gridXOffset = offset;
    this.#shouldRender = true;
  }

  set gridYOffset(offset: number) {
    this.#gridYOffset = offset;
    this.#shouldRender = true;
  }

  set gridColor(color: string) {
    this.#gridColor = color;
    this.#shouldRender = true;
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
    this.#shouldRender = true;
  }

  set tempPosition(position: Coordinates | null) {
    this.#tempPosition = position;
    if (position !== null) {
      this.#shouldRender = true;
    }
  }

  set zoom(zoom: number) {
    if (this.#zoom === zoom) return;
    this.#zoom = zoom;
    this.#shouldRender = true;
  }

  set selectedUnits(units: Unit[]) {
    this.#selectedUnits = units;
    this.#shouldRender = true;
  }

  selectUnit(unit: Unit, append: boolean) {
    if (!append) {
      this.deselectAllUnits();
    }
    this.#selectedUnits.push(unit);
    this.#shouldRender = true;
  }

  deselectUnit(unit: Unit) {
    this.#selectedUnits = this.#selectedUnits.filter((u) => u.id !== unit.id);
    this.#shouldRender = true;
  }

  deselectAllUnits() {
    if (this.#selectedUnits.length === 0) return;
    this.#selectedUnits = [];
    this.#shouldRender = true;
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

    if (
      this.backgroundImageSize.width < this.windowSize.width ||
      this.backgroundImageSize.height < this.windowSize.height
    ) {
      this.#backgroundImageSize.width = this.windowSize.width;
      this.#backgroundImageSize.height = this.windowSize.height;
    }

    const numberOfColumns = Math.ceil(
      this.#backgroundImageSize.width / this.#gridSize.width
    );
    const numberOfRows = Math.ceil(
      this.#backgroundImageSize.height / this.#gridSize.height
    );
    this.#grid.populateGrid(numberOfColumns, numberOfRows);
    this.#shouldRender = true;
  }

  private onImageLoad() {
    this.resizeGrid();

    this.#position = { x: 0, y: 0 };
    this.#zoom = 1;
    this.#shouldRender = true;
    this.#loading = false;
  }

  private onResize() {
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#shouldRender = true;
  }

  private setCanvasSize() {
    this.#canvas.width = this.#windowSize.width;
    this.#canvas.height = this.#windowSize.height;
    this.#shouldRender = true;
  }

  private async renderLoop() {
    if (!this.canvas) {
      console.warn("Canvas not found");
      return;
    }
    if (this.#shouldRender) {
      this.#shouldRender = false;
      this.#ctx.clearRect(
        0,
        0,
        this.#windowSize.width,
        this.#windowSize.height
      );
      this.#ctx.fillStyle = "black";
      this.#ctx.fillRect(0, 0, this.#windowSize.width, this.#windowSize.height);
      const position = this.#tempPosition || this.#position;
      const viewportSize: Size = {
        width: this.#windowSize.width,
        height: this.#windowSize.height,
      };
      if (this.#backgroundImage?.complete) {
        const visibleWidth =
          Math.min(this.#backgroundImageSizeNatural.width, viewportSize.width) /
          this.#zoom;
        const visibleHeight =
          Math.min(
            this.#backgroundImageSizeNatural.height,
            viewportSize.height
          ) / this.#zoom;

        const sxFactor =
          this.#backgroundImageSizeNatural.width /
          this.#backgroundImageSize.width;
        const syFactor =
          this.#backgroundImageSizeNatural.height /
          this.#backgroundImageSize.height;

        const sx = -position.x * sxFactor;
        const sy = -position.y * syFactor;
        const sw = visibleWidth;
        const sh = visibleHeight;

        const dx = 0;
        const dy = 0;
        const dw = viewportSize.width;
        const dh = viewportSize.height;

        // const backgroundSize = {
        //   width: this.#backgroundImageSize.width / this.#zoom,
        //   height: this.#backgroundImageSize.height / this.#zoom,
        // }

        // const dx = backgroundSize.width < viewportSize.width ? (viewportSize.width - backgroundSize.width) / 2 : 0;
        // const dy = backgroundSize.height < viewportSize.height ? (viewportSize.height - backgroundSize.height) / 2 : 0;
        // const dw = backgroundSize.width < viewportSize.width ? backgroundSize.width : viewportSize.width
        // const dh = backgroundSize.height < viewportSize.height ? backgroundSize.height : viewportSize.height

        this.#ctx.drawImage(
          this.#backgroundImage,
          sx,
          sy,
          sw,
          sh,
          dx,
          dy,
          dw,
          dh
        );
      }
      this.#grid.draw();
      this.#units.forEach((unit) => unit.draw());
    }
    const id = requestAnimationFrame(() => this.renderLoop());
    this.#animationFrameId = id;
  }

  /**
   * Public methods
   */
  init() {
    if (!this.#canvas) {
      console.warn("Canvas not found");
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
    this.renderLoop();
  }

  moveUnit(unit: Unit, from: Cell, to: Cell): void {
    unit.tempPosition = null;
    unit.cell = to;
    this.shouldRender = true;
  }
}
