import Unit, { InitUnitProps } from "./Unit";
import { VTT } from "./VTT";

export class Cell {
  #vtt: VTT;
  #row: number;
  #col: number;
  #units: Unit[] = [];
  #isSelected: boolean = false;

  constructor(vtt: VTT, row: number, col: number) {
    this.#vtt = vtt;
    this.#row = row;
    this.#col = col;
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

  get x(): number {
    const { row } = this;
    const { gridSize, zoom, gridXOffset } = this.#vtt;
    const position = this.#vtt.getPosition();
    const gridSizeZoomed = gridSize * zoom;
    const xOffset = (gridXOffset - position.x) * zoom;
    return row * gridSizeZoomed - xOffset;
  }

  get y(): number {
    const { col } = this;
    const { gridSize, zoom, gridYOffset } = this.#vtt;
    const position = this.#vtt.getPosition();
    const gridSizeZoomed = gridSize * zoom;
    const yOffset = (gridYOffset - position.y) * zoom;
    return col * gridSizeZoomed - yOffset;
  }

  onClick(): void {
    this.#isSelected = !this.#isSelected;
    this.#vtt.shouldRender = true;
  }

  draw(): void {
    const { ctx, gridSize, zoom, gridColor } = this.#vtt;
    const gridSizeZoomed = gridSize * zoom;
    ctx.strokeStyle = gridColor;
    ctx.strokeRect(this.x, this.y, gridSizeZoomed, gridSizeZoomed);

    if (this.#isSelected) {
      ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
      ctx.fillRect(this.x, this.y, gridSizeZoomed, gridSizeZoomed);
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
