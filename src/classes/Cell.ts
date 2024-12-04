import Unit, { InitUnitProps } from "./Unit";
import { VTT } from "./VTT";

export class Cell {
  #id: number;
  #vtt: VTT;
  #row: number;
  #col: number;
  #units: Unit[] = [];
  #isSelected: boolean = false;

  constructor(vtt: VTT, row: number, col: number) {
    this.#id = Math.floor(Math.random() * 10000000);
    this.#vtt = vtt;
    this.#row = row;
    this.#col = col;
  }

  get id(): number {
    return this.#id;
  }

  get vtt(): VTT {
    return this.#vtt;
  }

  get row(): number {
    return this.#row;
  }

  get col(): number {
    return this.#col;
  }

  get units(): Unit[] {
    return this.#units;
  }

  get x(): number {
    const { col } = this;
    const { gridSize, zoom, gridXOffset } = this.#vtt;
    const position = this.#vtt.getPosition();
    const gridSizeZoomed = gridSize.width * zoom;
    const xOffset = (gridXOffset - position.x) * zoom;
    return col * gridSizeZoomed - xOffset;
  }

  get y(): number {
    const { row } = this;
    const { gridSize, zoom, gridYOffset } = this.#vtt;
    const position = this.#vtt.getPosition();
    const gridSizeZoomed = gridSize.height * zoom;
    const yOffset = (gridYOffset - position.y) * zoom;
    return row * gridSizeZoomed - yOffset;
  }

  onClick(): void {
    this.#isSelected = !this.#isSelected;
    this.#vtt.shouldRender = true;
  }

  draw(): void {
    const { ctx, gridSize, zoom, gridColor } = this.#vtt;
    const width = gridSize.width * zoom;
    const height = gridSize.height * zoom;
    ctx.strokeStyle = gridColor;
    ctx.strokeRect(this.x, this.y, width, height);

    if (this.#isSelected) {
      ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
      ctx.fillRect(this.x, this.y, width, height);
    }

    this.#units.forEach((unit) => unit.draw());
  }

  createUnit(unit: Omit<InitUnitProps, "cell">): void {
    this.#units.push(new Unit({ ...unit, cell: this }));
  }

  removeUnit(unit: Unit): void {
    this.#units = this.#units.filter((u) => u.id !== unit.id);
  }

  addUnit(unit: Unit): void {
    this.#units.push(unit);
  }
}
