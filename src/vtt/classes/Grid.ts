import { BaseClass } from "@/vtt/classes/BaseClass";
import { Cell } from "@/vtt/classes/Cell";
import { VTT } from "@/vtt/classes/VTT";

export class Grid extends BaseClass {
  #vtt: VTT;
  #cells: Cell[][] = [];

  constructor(vtt: VTT, rows: number, columns: number) {
    super();
    this.#vtt = vtt;
    this.#cells = [];
    this.populateGrid(rows, columns);
  }

  get cells(): Cell[][] {
    return this.#cells;
  }

  populateGrid(columns: number, rows: number): void {
    this.#cells = [];
    for (let row = 0; row < rows; row++) {
      this.#cells[row] = [];
      for (let col = 0; col < columns; col++) {
        this.#cells[row][col] = new Cell({
          vtt: this.#vtt,
          row,
          col,
        });
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

  drawForeground(): void {
    this.#cells.forEach((row) => {
      row.forEach((cell) => {
        cell.drawForeground();
      });
    });
  }
}
