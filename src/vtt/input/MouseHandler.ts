import { MouseEvent } from "react";
import { VTT } from "@/vtt/classes/VTT";
import { Coordinates } from "@/vtt/types/types";

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
  #destroyed: boolean = false;
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
    if (this.#vtt.canvas.background) {
      this.#eventListeners = {
        mousemove: this.mouseMove.bind(this),
        wheel: this.onScroll.bind(this),
        mousedown: this.mouseDown.bind(this),
        mouseup: this.mouseUp.bind(this),
        contextmenu: this.contextMenu.bind(this),
        click: this.click.bind(this),
      };
    }
  }

  destroy() {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    Object.keys(this.#eventListeners).forEach((key) => {
      /* @ts-ignore */
      // this.#vtt.canvas.removeEventListener(key, this.#eventListeners[key]);
      document.body.removeEventListener(key, this.#eventListeners[key]);
    });
  }

  init() {
    if (!window.mousehandlers) {
      window.mousehandlers = [];
    }
    window.mousehandlers.forEach((handler: MouseHandler) => {
      handler.destroy();
    });
    window.mousehandlers.push(this);
    Object.keys(this.#eventListeners).forEach((key) => {
      /* @ts-ignore */
      document.body.addEventListener(key, this.#eventListeners[key]);
    });
  }

  clearMoveUnitStartCoordinates() {
    this.#moveUnitStartCoordinates = null;
  }

  private click(_event: MouseEvent) {}

  private mouseMove(event: MouseEvent) {
    this.#vtt.mousePosition = { x: event.clientX, y: event.clientY };
    if (this.#panMovementStartCoordinates) {
      const mouseDragX =
        this.#vtt.mousePosition.x - this.#panMovementStartCoordinates.x;
      const mouseDragY =
        this.#vtt.mousePosition.y - this.#panMovementStartCoordinates.y;

      const tempPositionX = this.#vtt.position.x + mouseDragX;
      const tempPositionY = this.#vtt.position.y + mouseDragY;

      const maxPositionX = this.#vtt.backgroundImageSize.width * 1.25;
      const minPositionX = -this.#vtt.backgroundImageSize.width * 1.25;

      const maxPositionY = this.#vtt.backgroundImageSize.height * 1.25;
      const minPositionY = -this.#vtt.backgroundImageSize.height * 1.25;

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
      const zoom = 1;
      if (unit) {
        const unitSize = Math.min(unit.width, unit.height) * zoom;
        const canvasCoordinates = this.getCanvasCoordinates(
          this.#vtt.mousePosition
        );
        if (
          unit.tempPosition ||
          this.getDistanceBetweenCoordinates(
            this.#moveUnitStartCoordinates,
            canvasCoordinates
          ) >
            unitSize / 2
        ) {
          unit.tempPosition = {
            x: canvasCoordinates.x - unit.width / 2,
            y: canvasCoordinates.y - unit.height / 2,
          };
        }
        this.#vtt.render("foreground");
      }
    }
  }

  private contextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  private mouseDown(event: MouseEvent) {
    // if right mouse button is clicked
    if (event.button === 2 && !this.#panMovementStartCoordinates) {
      this.#panMovementStartCoordinates = { ...this.#vtt.mousePosition };
    }
    // if left mouse button is clicked
    if (event.button === 0) {
      if (!this.#moveUnitStartCoordinates) {
        const cell = this.getCellAtMousePosition();
        if (cell) {
          cell.onClick();
        }
        const unit = this.#vtt.units.find(
          (unit) =>
            unit.gridPosition?.col === cell?.col &&
            unit.gridPosition?.row === cell?.row
        );
        if (unit) {
          this.#moveUnitStartCoordinates = { ...this.#vtt.mousePosition };
          this.#vtt.selectUnit(unit, event.ctrlKey || event.metaKey);
        } else {
          this.#vtt.deselectAllUnits();
        }
      }
    }
  }

  private mouseUp() {
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

      // If control key is pressed, do not move the unit
      if (this.#vtt.pressedKeys?.[17]) {
        unit.addTempPosition({
          x: toCell.getX(),
          y: toCell.getY(),
        });
        return;
      }

      if (fromCell.id === toCell.id) {
        unit.tempPosition = null;
        this.#vtt.render("foreground");
      } else {
        this.#vtt.moveUnit(unit, toCell, true);
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
      Math.max(0.125, this.#vtt.zoom + step * (direction === "in" ? 1 : -1)),
      3
    );
  }

  private getDistanceBetweenCoordinates(a: Coordinates, b: Coordinates) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private getCanvasCoordinates(coordinates: Coordinates) {
    // Zoom is applied to the center of the canvas, so we need to adjust the coordinates based on the actual position of the canvas and not the position inn this.#vtt.position
    const rect = this.#vtt.canvas.background.getBoundingClientRect();

    const canvasX = (coordinates.x - rect.left) / this.#vtt.zoom;
    const canvasY = (coordinates.y - rect.top) / this.#vtt.zoom;

    return { x: canvasX, y: canvasY };
  }

  private getCellAtMousePosition() {
    return this.getCellAtCoordinates(this.#vtt.mousePosition);
  }

  private getCellAtCoordinates(coordinates: Coordinates) {
    const cellWidth = this.#vtt.gridSize.width;
    const cellHeight = this.#vtt.gridSize.height;

    const canvasCoordinates = this.getCanvasCoordinates(coordinates);

    if (
      canvasCoordinates.x < 0 ||
      canvasCoordinates.x >= this.#vtt.canvas.background.width ||
      canvasCoordinates.y < 0 ||
      canvasCoordinates.y >= this.#vtt.canvas.background.height
    ) {
      return null;
    }

    const col = Math.floor(canvasCoordinates.x / cellWidth);
    const row = Math.floor(canvasCoordinates.y / cellHeight);

    if (!this.#vtt.grid.cells[row] || !this.#vtt.grid.cells[row][col]) {
      return null;
    }

    return this.#vtt.grid.cells[row][col];
  }
}
