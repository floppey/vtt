import { Coordinates, Size } from "@/vtt/types/types";

export const getNumberOfDiagonalMoves = (
  start: Coordinates,
  end: Coordinates,
  gridSize: Size
): number => {
  const dx = Math.abs(end.x - start.x) / gridSize.width;
  const dy = Math.abs(end.y - start.y) / gridSize.height;

  // Calculate the number of diagonal moves
  return Math.round(Math.min(dx, dy));
};
