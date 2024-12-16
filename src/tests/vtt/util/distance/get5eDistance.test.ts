import { get5eDistance } from "@/vtt/util/distance/get5eDistance";
import { Coordinates, Size } from "@/vtt/types/types";

describe("get5eDistance", () => {
  const gridSize: Size = { width: 5, height: 5 };

  it("should calculate distance for straight horizontal move", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 10, y: 0 };
    const result = get5eDistance(start, end, gridSize);
    expect(result).toEqual({
      numberOfFeet: 10,
      numberOfSquares: 2,
      diagonalMoves: 0,
      straightMoves: 2,
    });
  });

  it("should calculate distance for straight vertical move", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 0, y: 10 };
    const result = get5eDistance(start, end, gridSize);
    expect(result).toEqual({
      numberOfFeet: 10,
      numberOfSquares: 2,
      diagonalMoves: 0,
      straightMoves: 2,
    });
  });

  it("should calculate distance for diagonal move", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 10, y: 10 };
    const result = get5eDistance(start, end, gridSize);
    expect(result).toEqual({
      numberOfFeet: 15,
      numberOfSquares: 3,
      diagonalMoves: 2,
      straightMoves: 0,
    });
  });

  it("should calculate distance for mixed move", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 15, y: 10 };
    const result = get5eDistance(start, end, gridSize);
    expect(result).toEqual({
      numberOfFeet: 20,
      numberOfSquares: 4,
      diagonalMoves: 2,
      straightMoves: 1,
    });
  });

  it("should calculate distance with startDiagonal set to true", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 10, y: 10 };
    const result = get5eDistance(start, end, gridSize, 5, true);
    expect(result).toEqual({
      numberOfFeet: 10,
      numberOfSquares: 2,
      diagonalMoves: 2,
      straightMoves: 0,
    });
  });
});
