import { get5eDistance } from "@/vtt/util/distance/get5eDistance";
import { Coordinates, Size } from "@/vtt/types/types";

describe("get5eDistance", () => {
  const gridSize: Size = { width: 5, height: 5 };
  const feetPerSquare = 5;

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
      numberOfSquares: 2,
      diagonalMoves: 2,
      straightMoves: 0,
    });
  });

  it("should count every second diagonal move as twice the length, starting at the second move", () => {
    const diagonalMoves = 3;
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = {
      x: diagonalMoves * gridSize.width,
      y: diagonalMoves * gridSize.height,
    };
    const result = get5eDistance(start, end, gridSize, feetPerSquare, false);
    expect(result).toEqual({
      numberOfFeet: 20, // 5 + 10 + 5 = 20
      numberOfSquares: 3,
      diagonalMoves: 3,
      straightMoves: 0,
    });
  });

  it("should count every second diagonal move as twice the length, starting at the first move when startDiagonal is true", () => {
    const diagonalMoves = 3;
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = {
      x: diagonalMoves * gridSize.width,
      y: diagonalMoves * gridSize.height,
    };
    const result = get5eDistance(start, end, gridSize, feetPerSquare, true);
    expect(result).toEqual({
      numberOfFeet: 25, // 10 + 5 + 10 = 25
      numberOfSquares: 3,
      diagonalMoves: 3,
      straightMoves: 0,
    });
  });

  it("should calculate distance for mixed move", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 15, y: 10 };
    const result = get5eDistance(start, end, gridSize);
    expect(result).toEqual({
      numberOfFeet: 20,
      numberOfSquares: 3,
      diagonalMoves: 2,
      straightMoves: 1,
    });
  });

  it("should calculate distance with different feet per square", () => {
    const start: Coordinates = { x: 0, y: 0 };
    const end: Coordinates = { x: 15, y: 10 };
    const result = get5eDistance(start, end, gridSize, 10);
    expect(result).toEqual({
      numberOfFeet: 40,
      numberOfSquares: 3,
      diagonalMoves: 2,
      straightMoves: 1,
    });
  });
});
