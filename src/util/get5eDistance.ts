import { Coordinates, Size } from "../types/types";

export const get5eDistance = (
  start: Coordinates,
  end: Coordinates,
  gridSize: Size,
  feetPerSquare: number = 5
): number => {
  const dx = Math.abs(end.x - start.x) / gridSize.width;
  const dy = Math.abs(end.y - start.y) / gridSize.height;

  // Calculate the number of diagonal and straight moves
  const diagonalMoves = Math.round(Math.min(dx, dy));
  const straightMoves = Math.abs(dx - dy);

  // Every second diagonal move counts as 2 moves, but we can't have half a move
  let diagonalMovement = 0;
  for (let i = 0; i < diagonalMoves; i++) {
    if (i % 2 === 0) {
      diagonalMovement += 1;
    } else {
      diagonalMovement += 2;
    }
  }

  // Calculate the total distance
  const distance = Math.round(diagonalMovement + straightMoves) * feetPerSquare;

  return distance;
};
