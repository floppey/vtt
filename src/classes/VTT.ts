import { MouseHandler } from "../input/MouseHandler";
import { Coordinates, Size } from "../types/types";
import { Grid } from "./Grid";
import Unit from "./Unit";

export class VTT {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #gridSize: number;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #loading: boolean;
  #mouseHandler: MouseHandler;
  #shouldRender: boolean;
  #backgroundImage: HTMLImageElement | null;
  #backgroundImageSize: Size;
  #position: Coordinates;
  #tempPosition: Coordinates | null;
  #mousePosition: Coordinates;
  #gridColor: string;
  #gridXOffset: number;
  #gridYOffset: number;
  #grid: Grid;

  constructor(canvasId: string, backgroundImageUrl: string) {
    this.#canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.#ctx = this.#canvas.getContext("2d") as CanvasRenderingContext2D;
    this.#gridSize = 50;
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
    this.#backgroundImage.onload = () => this.onImageLoad();
    this.#mouseHandler = new MouseHandler(this);

    this.#grid = new Grid(this, 10, 10);

    this.init();

    window.addEventListener("resize", () => this.onResize());
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

  /**
   * Setters
   */

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

  set gridSize(size: number) {
    this.#gridSize = size;
    this.#shouldRender = true;
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

  /**
   * Private methods
   */

  private onImageLoad() {
    this.#backgroundImageSize = {
      width: this.#backgroundImage?.naturalWidth || 0,
      height: this.#backgroundImage?.naturalHeight || 0,
    };
    const numberOfColumns = Math.ceil(
      this.#backgroundImageSize.width / this.#gridSize
    );
    const numberOfRows = Math.ceil(
      this.#backgroundImageSize.height / this.#gridSize
    );
    this.#grid.populateGrid(numberOfColumns, numberOfRows);

    this.#grid.cells[5][5].createUnit({
      name: "Player 1",
      maxHealth: 100,
      type: "player",
    });

    this.#position = { x: 0, y: 0 };
    this.#zoom = 1;
    this.#shouldRender = true;
    this.#loading = false;
  }

  private onResize() {
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#shouldRender = true;
  }

  private init() {
    this.setCanvasSize();
    this.renderLoop();
  }

  private setCanvasSize() {
    this.#canvas.width = this.#windowSize.width;
    this.#canvas.height = this.#windowSize.height;
    this.#shouldRender = true;
  }

  private async renderLoop() {
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
          Math.min(this.#backgroundImageSize.width, viewportSize.width) /
          this.#zoom;
        const visibleHeight =
          Math.min(this.#backgroundImageSize.height, viewportSize.height) /
          this.#zoom;
        const sx = -position.x;
        const sy = -position.y;
        const sw = visibleWidth;
        const sh = visibleHeight;
        this.#ctx.drawImage(
          this.#backgroundImage,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          this.#windowSize.width,
          this.#windowSize.height
        );
      }
      this.#grid.draw();
    }
    const id = requestAnimationFrame(() => this.renderLoop());
    this.#animationFrameId = id;
  }
}
