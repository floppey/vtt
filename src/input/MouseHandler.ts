import { VTT } from "../classes/VTT";
import { Coordinates } from "../types/types";

export class MouseHandler {
  #vtt: VTT;
  #mouseDragStart: Coordinates | null;

  constructor(vtt: VTT) {
    this.#vtt = vtt;
    this.#mouseDragStart = null;

    this.#vtt.canvas.addEventListener("mousemove", (e) => this.mouseMove(e));
    this.#vtt.canvas.addEventListener("wheel", (e) => this.onScroll(e));
    this.#vtt.canvas.addEventListener("mousedown", (e) => this.mouseDown(e));
    this.#vtt.canvas.addEventListener("mouseup", () => this.mouseUp());
    this.#vtt.canvas.addEventListener("contextmenu", (e) =>
      this.contextMenu(e)
    );
    this.#vtt.canvas.addEventListener("click", () =>
      this.#vtt.grid.cells[4][4].onClick()
    );
  }

  mouseMove(event: MouseEvent) {
    this.#vtt.mousePosition = { x: event.clientX, y: event.clientY };
    if (this.#mouseDragStart) {
      // set temp position within image. Allow going 1/4 of the image size outside of the image
      const mouseDragX = this.#vtt.mousePosition.x - this.#mouseDragStart.x;
      const mouseDragY = this.#vtt.mousePosition.y - this.#mouseDragStart.y;

      const zoomedDragX = mouseDragX / this.#vtt.zoom;
      const zoomedDragY = mouseDragY / this.#vtt.zoom;

      const tempPositionX = this.#vtt.position.x + zoomedDragX;
      const tempPositionY = this.#vtt.position.y + zoomedDragY;

      const maxPositionX = this.#vtt.backgroundImageSize.width / 4;
      const minPositionX =
        -this.#vtt.backgroundImageSize.width + this.#vtt.windowSize.width / 2;

      const maxPositionY = this.#vtt.windowSize.height / 4;
      const minPositionY =
        -this.#vtt.backgroundImageSize.height + this.#vtt.windowSize.height / 2;

      const boundedX = Math.max(
        minPositionX,
        Math.min(maxPositionX, tempPositionX)
      );
      const boundedY = Math.max(
        minPositionY,
        Math.min(maxPositionY, tempPositionY)
      );

      this.#vtt.tempPosition = {
        x: boundedX,
        y: boundedY,
      };
    }
  }

  contextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  mouseDown(event: MouseEvent) {
    // if right mouse button is clicked
    if (event.button === 2 && !this.#mouseDragStart) {
      this.#mouseDragStart = { ...this.#vtt.mousePosition };
    }
  }

  mouseUp() {
    this.#mouseDragStart = null;
    if (this.#vtt.tempPosition) {
      this.#vtt.position = { ...this.#vtt.tempPosition };
      this.#vtt.tempPosition = null;
    }
  }

  private onScroll(event: WheelEvent) {
    event.preventDefault();
    this.adjustZoom(event.deltaY > 0 ? "out" : "in");
  }

  private adjustZoom(direction: "in" | "out") {
    const step = 0.25;
    this.#vtt.zoom = Math.min(
      Math.max(0.25, this.#vtt.zoom + step * (direction === "in" ? 1 : -1)),
      3
    );
  }
}
