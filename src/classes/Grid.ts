import { Cell } from "./Cell";
import Unit from "./Unit";
import { VTT } from "./VTT";

export class Grid {
  #vtt: VTT;
  #cells: Cell[][] = [];

  constructor(vtt: VTT, rows: number, columns: number) {
    this.#vtt = vtt;
    this.#cells = [];
    this.populateGrid(rows, columns);
  }

  get cells(): Cell[][] {
    return this.#cells;
  }

  populateGrid(columns: number, rows: number): void {
    // TODO: Persist units
    const gridBackup = [...this.#cells];
    this.#cells = [];
    for (let row = 0; row < rows; row++) {
      this.#cells[row] = [];
      for (let col = 0; col < columns; col++) {
        this.#cells[row][col] = new Cell(this.#vtt, row, col);
      }
    }
  }

  draw(): void {
    this.#cells.forEach((row) => {
      row.forEach((cell) => {
        cell.draw();
      });
    });
  }

  moveUnit(unit: Unit, from: Cell, to: Cell): void {
    from.removeUnit(unit);
    to.addUnit(unit);
    unit.tempPosition = null;
    unit.cell = to;
    this.#vtt.shouldRender = true;
  }
}
