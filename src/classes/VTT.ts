import { renderGrid } from "../canvas/renderGrid";

type Size = { width: number; height: number };
type Coordinates = { x: number; y: number };

export class VTT {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #gridSize: number;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #shouldRender: boolean;
  #backgroundImage: HTMLImageElement | null;
  #backgroundImageSize: Size;
  #position: Coordinates;
  #tempPosition: Coordinates | null;
  #mousePosition: Coordinates;
  #mouseDragStart: Coordinates | null;

  constructor(canvasId: string, backgroundImageUrl: string) {
    this.#canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.#ctx = this.#canvas.getContext("2d") as CanvasRenderingContext2D;
    this.#gridSize = 50;
    this.#zoom = 1;
    this.#windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#animationFrameId = 0;
    this.#shouldRender = true;
    this.#position = { x: 0, y: 0 };
    this.#tempPosition = null;
    this.#mousePosition = { x: 0, y: 0 };
    this.#mouseDragStart = null;
    this.#backgroundImage = new Image();
    this.#backgroundImage.src = backgroundImageUrl;
    this.#backgroundImageSize = { width: 0, height: 0 };
    this.#backgroundImage.onload = () => {
      this.#backgroundImageSize = {
        width: this.#backgroundImage?.naturalWidth || 0,
        height: this.#backgroundImage?.naturalHeight || 0,
      };
      this.#shouldRender = true;
    };

    this.init();

    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (e) => this.mouseMove(e));
    window.addEventListener("wheel", (e) => this.onScroll(e));
    window.addEventListener("mousedown", (e) => this.mouseDown(e));
    window.addEventListener("mouseup", () => this.mouseUp());
  }

  mouseMove(event: MouseEvent) {
    this.#mousePosition = { x: event.clientX, y: event.clientY };
    if (this.#mouseDragStart) {
      // set temp position within image. Allow going 1/4 of the image size outside of the image
      const mouseDragX = this.#mousePosition.x - this.#mouseDragStart.x;
      const mouseDragY = this.#mousePosition.y - this.#mouseDragStart.y;

      const zoomedDragX = mouseDragX / this.#zoom;
      const zoomedDragY = mouseDragY / this.#zoom;

      const tempPositionX = this.#position.x + zoomedDragX;
      const tempPositionY = this.#position.y + zoomedDragY;

      const maxPositionX = this.#backgroundImageSize.width / 4;
      const minPositionX =
        -this.#backgroundImageSize.width + this.#windowSize.width / 2;

      const maxPositionY = this.#windowSize.height / 4;
      const minPositionY =
        -this.#backgroundImageSize.height + this.#windowSize.height / 2;

      const boundedX = Math.max(
        minPositionX,
        Math.min(maxPositionX, tempPositionX)
      );
      const boundedY = Math.max(
        minPositionY,
        Math.min(maxPositionY, tempPositionY)
      );

      this.#tempPosition = {
        x: boundedX,
        y: boundedY,
      };
      this.#shouldRender = true;
    }
  }

  mouseDown(event: MouseEvent) {
    if (event.target !== this.#canvas) {
      return;
    }
    // if left mouse button is clicked
    if (event.button === 0 && !this.#mouseDragStart) {
      this.#mouseDragStart = { ...this.#mousePosition };
    }
  }

  mouseUp() {
    this.#mouseDragStart = null;
    if (this.#tempPosition) {
      this.#position = { ...this.#tempPosition };
      this.#tempPosition = null;
      this.#shouldRender = true;
    }
  }

  private onScroll(event: WheelEvent) {
    if (event.target !== this.#canvas) {
      return;
    }
    event.preventDefault();
    this.adjustZoom(event.deltaY > 0 ? "out" : "in");
  }

  private onResize() {
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.#shouldRender = true;
  }

  private adjustZoom(direction: "in" | "out") {
    const step = 0.25;
    this.#zoom = Math.min(
      Math.max(0.5, this.#zoom + step * (direction === "in" ? 1 : -1)),
      4
    );
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
      renderGrid(this);
      this.#ctx.textAlign = "center";
      this.#ctx.font = "20px Arial";
      this.#ctx.fillStyle = "black";
      this.#ctx.fillText(
        `${(this.#tempPosition || this.#position).x},${
          (this.#tempPosition || this.#position).y
        } | ${this.#zoom.toFixed(2)} | ${this.#gridSize}`,
        this.#windowSize.width / 2,
        20
      );
    }
    const id = requestAnimationFrame(() => this.renderLoop());
    this.#animationFrameId = id;
  }

  set windowSize(size: { width: number; height: number }) {
    this.#windowSize = size;
    this.setCanvasSize();
  }

  get ctx() {
    return this.#ctx;
  }

  get gridSize() {
    return this.#gridSize;
  }

  get position() {
    return this.#tempPosition || this.#position;
  }

  get zoom() {
    return this.#zoom;
  }
}
