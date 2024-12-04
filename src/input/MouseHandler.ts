import { MouseEvent } from "react";
import { VTT } from "../classes/VTT";
import { Coordinates } from "../types/types";
import { Cell } from "../classes/Cell";

type MouseEventListener = (e: MouseEvent) => void;
type ScrollEventListener = (e: WheelEvent) => void;
type OtherEventListener = () => void;

interface EventListeners {
  mousemove: MouseEventListener;
  wheel: ScrollEventListener;
  mousedown: MouseEventListener;
  mouseup: OtherEventListener;
  contextmenu: MouseEventListener;
  click: MouseEventListener;
}

export class MouseHandler {
  #id: number;
  #created: number;
  #vtt: VTT;
  #panMovementStartCoordinates: Coordinates | null;
  #moveUnitStartCoordinates: Coordinates | null;
  #eventListeners: Partial<EventListeners> = {};

  constructor(vtt: VTT) {
    this.#created = Date.now();
    this.#id = Math.floor(Math.random() * 1000000);
    this.#vtt = vtt;
    this.#panMovementStartCoordinates = null;
    this.#moveUnitStartCoordinates = null;
    if (this.#vtt.canvas) {
      this.#eventListeners = {
        mousemove: this.mouseMove.bind(this),
        wheel: this.onScroll.bind(this),
        mousedown: this.mouseDown.bind(this),
        mouseup: this.mouseUp.bind(this),
        contextmenu: this.contextMenu.bind(this),
        click: this.click.bind(this),
      };

      Object.keys(this.#eventListeners).forEach((key) => {
        /* @ts-ignore */
        this.#vtt.canvas.addEventListener(key, this.#eventListeners[key]);
      });
    }

    if (!window.mousehandlers) {
      window.mousehandlers = [];
    }
    window.mousehandlers.forEach((handler: MouseHandler) => {
      handler.destroy();
    });
    window.mousehandlers = [this];
  }

  destroy() {
    Object.keys(this.#eventListeners).forEach((key) => {
      /* @ts-ignore */
      this.#vtt.canvas.removeEventListener(key, this.#eventListeners[key]);
    });
  }

  private click(_event: MouseEvent) {}

  mouseMove(event: MouseEvent) {
    this.#vtt.mousePosition = { x: event.clientX, y: event.clientY };
    if (this.#panMovementStartCoordinates) {
      // set temp position within image. Allow going 1/4 of the image size outside of the image
      const mouseDragX =
        this.#vtt.mousePosition.x - this.#panMovementStartCoordinates.x;
      const mouseDragY =
        this.#vtt.mousePosition.y - this.#panMovementStartCoordinates.y;

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
    if (this.#moveUnitStartCoordinates) {
      const unit = this.#vtt.selectedUnits[0];
      if (unit) {
        const unitSize = Math.min(unit.width, unit.height) * this.#vtt.zoom;
        if (
          unit.tempPosition ||
          this.getDistanceBetweenCoordinates(
            this.#moveUnitStartCoordinates,
            this.#vtt.mousePosition
          ) >
            unitSize / 2
        ) {
          unit.tempPosition = {
            x: this.#vtt.mousePosition.x - (unit.width * this.#vtt.zoom) / 2,
            y: this.#vtt.mousePosition.y - (unit.height * this.#vtt.zoom) / 2,
          };
        }
        this.#vtt.shouldRender = true;
      }
    }
  }

  contextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  mouseDown(event: MouseEvent) {
    // if right mouse button is clicked
    if (event.button === 2 && !this.#panMovementStartCoordinates) {
      this.#panMovementStartCoordinates = { ...this.#vtt.mousePosition };
    }
    // if left mouse button is clicked
    if (event.button === 0) {
      this.#moveUnitStartCoordinates = { ...this.#vtt.mousePosition };
      const cell = this.getCellAtMousePosition();
      const unit = this.#vtt.units.find(
        (unit) => (unit.cell?.id ?? -1) === (cell?.id ?? -2)
      );

      if (unit) {
        this.#vtt.selectUnit(unit, event.ctrlKey || event.metaKey);
      } else {
        this.#vtt.deselectAllUnits();
      }
    }
  }

  mouseUp() {
    this.#panMovementStartCoordinates = null;

    if (this.#vtt.tempPosition) {
      this.#vtt.position = { ...this.#vtt.tempPosition };
      this.#vtt.tempPosition = null;
    }

    if (this.#moveUnitStartCoordinates) {
      const fromCell = this.getCellAtCoordinates(
        this.#moveUnitStartCoordinates
      );
      const toCell = this.getCellAtMousePosition();
      if (!fromCell || !toCell) {
        return;
      }
      const unit = this.#vtt.selectedUnits[0];
      if (!unit) {
        return;
      }

      if (fromCell.id === toCell.id) {
        unit.tempPosition = null;
      } else {
        this.#vtt.moveUnit(unit, fromCell, toCell);
      }
      this.#moveUnitStartCoordinates = null;
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

  private getDistanceBetweenCoordinates(a: Coordinates, b: Coordinates) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private getCellAtMousePosition() {
    return this.getCellAtCoordinates(this.#vtt.mousePosition);
  }

  private getCellAtCoordinates(coordinates: Coordinates) {
    const cellHeight = this.#vtt.gridSize.height * this.#vtt.zoom;
    const cellWidth = this.#vtt.gridSize.width * this.#vtt.zoom;

    let cell: Cell | undefined;
    for (let x = 0; x < this.#vtt.grid.cells.length && !cell; x++) {
      const testCellX = this.#vtt.grid.cells[x][0];

      if (
        coordinates.y < testCellX.y ||
        coordinates.y > testCellX.y + cellHeight
      ) {
        continue;
      }

      for (let y = 0; y < this.#vtt.grid.cells[x].length && !cell; y++) {
        const testCellY = this.#vtt.grid.cells[x][y];
        if (
          coordinates.x > testCellY.x &&
          coordinates.x < testCellY.x + cellWidth
        ) {
          cell = testCellY;
        }
      }
    }
    return cell;
  }
}
