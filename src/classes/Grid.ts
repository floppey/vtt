import { Cell } from "./Cell";
import { VTT } from "./VTT";

export class Grid {
  #vtt: VTT;
  #cells: Cell[][] = [];

  constructor(vtt: VTT, rows: number, columns: number) {
    this.#vtt = vtt;
    this.#cells = [];
    this.populateGrid(rows, columns);
  }

  populateGrid(width: number, height: number): void {
    for (let y = 0; y < height; y++) {
      this.#cells[y] = [];
      for (let x = 0; x < width; x++) {
        this.#cells[y][x] = new Cell(this.#vtt, x, y);
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
}
