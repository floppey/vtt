import { generateGuid } from "@/util/generateGuid";
import { KeyboardHandler } from "../input/KeyboardHandler";
import { MouseHandler } from "../input/MouseHandler";
import { renderFogOfWar } from "../renderFunctions/renderFogOfWar";
import { renderFullscreenImage } from "../renderFunctions/renderFullscreenImage";
import { renderUnitVision } from "../renderFunctions/renderUnitVision";
import { Coordinates, Size } from "../types/types";
import { Cell } from "./Cell";
import { Grid } from "./Grid";
import Unit from "./Unit";
import { postMoveUnit } from "@/api/postMoveUnit";
import { BaseClass } from "./BaseClass";
import { postAddUnit } from "@/api/postAddUnit";
import { generateRandomName } from "@/util/generateRandomUser";

interface VTTProps {
  backgroundCanvasId: string;
  foregroundCanvasId: string;
  websocketChannel: string;
}

export type CanvasKey = "background" | "foreground";

export class VTT extends BaseClass {
  #websocketChannel: string;
  #websocketClientId: string;
  #canvas: Record<CanvasKey, HTMLCanvasElement>;
  #ctx: Record<CanvasKey, CanvasRenderingContext2D>;
  #renderConditions: Record<CanvasKey, boolean>;
  #hud: HTMLDivElement;
  #gridSize: Size;
  #zoom: number;
  #windowSize: Size;
  #animationFrameId: number;
  #loading: boolean;
  #isDebug: boolean;
  #mouseHandler: MouseHandler;
  #keyboardHandler: KeyboardHandler;
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

  initialized = false;

  constructor({
    backgroundCanvasId,
    foregroundCanvasId,
    websocketChannel,
  }: VTTProps) {
    super();
    this.#websocketChannel = websocketChannel;
    this.#websocketClientId = `unset-${generateGuid()}`;
    this.#hud = document.getElementById("hud") as HTMLDivElement;
    this.#canvas = {
      background: document.getElementById(
        backgroundCanvasId
      ) as HTMLCanvasElement,
      foreground: document.getElementById(
        foregroundCanvasId
      ) as HTMLCanvasElement,
    };
    this.#ctx = {
      background: this.#canvas.background.getContext(
        "2d"
      ) as CanvasRenderingContext2D,
      foreground: this.#canvas.foreground.getContext(
        "2d"
      ) as CanvasRenderingContext2D,
    };
    this.#isDebug = true;
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

  set websocketClientId(clientId: string) {
    this.#websocketClientId = clientId;
  }

  /**
   * Private methods
   */

  private resizeGrid() {
    this.#backgroundImageSize = {
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
        console.warn(`Canvas not found - resizeCanvases: ${key}`);
        return;
      }
      canvas.width = this.#backgroundImageSize.width;
      canvas.height = this.#backgroundImageSize.height;
    });
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
      console.warn(`Canvas not found - clearCanvas: ${key}`);
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
      console.warn("Canvas not found - renderLoop");
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
      console.warn("HUD not found");
      this.#hud = document.getElementById("hud") as HTMLDivElement;
    }

    if (this.#renderConditions.background) {
      this.#renderConditions.background = false;
      this.clearCanvas("background");
      const ctx = this.#ctx.background;
      const canvas = this.canvas.background;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      renderFullscreenImage(this, "background", this.#backgroundImage!);
      this.#grid.draw();
      renderUnitVision(this);
      this.units.forEach((unit) => renderFogOfWar(unit));
    }
    if (this.#renderConditions.foreground) {
      this.#renderConditions.foreground = false;
      this.clearCanvas("foreground");
      this.#units.forEach((unit) => unit.draw());
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
      const canvas = this.canvas[key as CanvasKey];
      if (!canvas) {
        console.warn(`Canvas not found - init: ${key}`);
        canvasFound = false;
      }
    });
    if (!canvasFound) return;
    this.initialized = true;
    this.#mouseHandler?.destroy();
    this.#mouseHandler = new MouseHandler(this);
    this.#mouseHandler.init();
    this.#keyboardHandler?.destroy();
    this.#keyboardHandler = new KeyboardHandler(this);
    this.#keyboardHandler.init();
    this.resizeCanvases();
    const newUnit = new Unit({
      vtt: this,
      maxHealth: 100,
      name: generateRandomName(),
      type: "unit",
      gridPosition: {
        row: Math.floor(Math.random() * (this.grid?.cells?.length ?? 0)),
        col: Math.floor(Math.random() * (this.grid?.cells?.[0]?.length ?? 0)),
      },
    });
    this.#units = [];
    this.addUnit(newUnit, newUnit.cell ?? this.grid.cells[0][0], true);
    this.selectUnit(this.units[0], false);
    this.centerCanvasOnUnit(this.units[0]);
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
      this.#mouseHandler.clearMoveUnitStartCoordinates();
    }
    this.render("foreground");
  }

  deselectAllUnits() {
    if (this.#selectedUnits.length === 0) return;
    this.#selectedUnits = [];
    this.render("foreground");
  }

  addUnit(unit: Unit, destination: Cell, broadcast = false) {
    unit.vtt = this;
    unit.cell = destination;
    this.#units.push(unit);
    this.render("foreground");

    if (broadcast && this.websocketChannel) {
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

  moveUnit(unit: Unit, to: Cell, broadcast = false): void {
    if (!to) {
      console.warn("Destination cell not found");
      return;
    }
    unit.tempPosition = null;
    unit.cell = to;
    this.renderAll();

    if (broadcast && this.websocketChannel) {
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
