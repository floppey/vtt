import { Coordinates, Size } from "@/vtt/types/types";
import { getNumberOfDiagonalMoves } from "@/vtt/util/distance/getNumberOfDiagonalMoves";

interface Distance {
  numberOfFeet: number;
  numberOfSquares: number;
  diagonalMoves: number;
  straightMoves: number;
}

export const get5eDistance = (
  start: Coordinates,
  end: Coordinates,
  gridSize: Size,
  feetPerSquare: number = 5,
  startDiagonal: boolean = false
): Distance => {
  const dx = Math.abs(end.x - start.x) / gridSize.width;
  const dy = Math.abs(end.y - start.y) / gridSize.height;

  // Calculate the number of diagonal and straight moves
  const diagonalMoves = getNumberOfDiagonalMoves(start, end, gridSize);
  const straightMoves = Math.abs(dx - dy);

  // Every second diagonal move counts as 2 moves, but we can't have half a move
  let diagonalMovement = 0;
  for (let i = 0; i < diagonalMoves; i++) {
    if (i % 2 === (startDiagonal ? 0 : 1)) {
      diagonalMovement += 1;
    } else {
      diagonalMovement += 2;
    }
  }

  // Calculate the total distance
  const numberOfSquares = Math.round(diagonalMovement + straightMoves);
  const numberOfFeet = numberOfSquares * feetPerSquare;

  return {
    numberOfFeet,
    numberOfSquares,
    diagonalMoves,
    straightMoves,
  };
};
