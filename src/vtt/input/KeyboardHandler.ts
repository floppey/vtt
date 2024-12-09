import Unit from "../classes/Unit";
import { VTT } from "../classes/VTT";

interface EventListeners {
  keydown: (e: KeyboardEvent) => void;
  keyup: (e: KeyboardEvent) => void;
}

export class KeyboardHandler {
  #id: number;
  #created: number;
  #destroyed: boolean = false;
  #vtt: VTT;
  #eventListeners: Partial<EventListeners> = {};
  #pressedKeys: { [key: string]: boolean } = {};

  constructor(vtt: VTT) {
    this.#created = Date.now();
    this.#id = Math.floor(Math.random() * 1000000);
    this.#vtt = vtt;
    this.#pressedKeys = {};
    this.#eventListeners = {
      keydown: this.keyDownHandler.bind(this),
      keyup: this.keyUpHandler.bind(this),
    };
  }

  init() {
    if (!window.keyboardhandlers) {
      window.keyboardhandlers = [];
    }
    window.keyboardhandlers.forEach((handler: KeyboardHandler) => {
      handler.destroy();
    });
    window.keyboardhandlers.push(this);
    Object.keys(this.#eventListeners).forEach((key) => {
      /* @ts-ignore */
      window.addEventListener(key, this.#eventListeners[key]);
    });
  }

  get pressedKeys() {
    return this.#pressedKeys;
  }

  private keyDownHandler = (e: KeyboardEvent) => {
    if (this.ignoreInput(e) || this.#pressedKeys[e.keyCode]) {
      return;
    }

    this.#pressedKeys[e.keyCode] = true;
    switch (e.key) {
      // Escape
      case "Escape":
        e.preventDefault();
        this.#vtt.deselectAllUnits();
        break;
    }
  };

  private ignoreInput(e: KeyboardEvent) {
    return (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLSelectElement
    );
  }

  private keyUpHandler = (e: KeyboardEvent) => {
    if (this.ignoreInput(e)) {
      return;
    }
    this.#pressedKeys[e.keyCode] = false;
    switch (e.key) {
      // Movement
      case "ArrowUp":
      case "w":
      case "W":
        e.preventDefault();

        this.moveUnits(this.#vtt.selectedUnits, { row: -1, col: 0 });
        break;
      case "ArrowDown":
      case "s":
      case "S":
        e.preventDefault();
        this.moveUnits(this.#vtt.selectedUnits, { row: 1, col: 0 });
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        e.preventDefault();
        this.moveUnits(this.#vtt.selectedUnits, { row: 0, col: -1 });
        break;
      case "ArrowRight":
      case "d":
      case "D":
        e.preventDefault();
        this.moveUnits(this.#vtt.selectedUnits, { row: 0, col: 1 });
        break;
    }
  };

  private moveUnits(units: Unit[], distance: { row: number; col: number }) {
    units.forEach((unit) => {
      this.moveUnit(unit, distance);
    });
  }

  private moveUnit(unit: Unit, distance: { row: number; col: number }) {
    const from = unit.cell;
    if (!from) {
      return;
    }
    const to =
      this.#vtt.grid.cells[from.row + distance.row][from.col + distance.col];
    this.#vtt.moveUnit(unit, to);
  }

  destroy() {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    Object.keys(this.#eventListeners).forEach((key) => {
      /* @ts-ignore */
      window.removeEventListener(key, this.#eventListeners[key]);
    });
  }
}
