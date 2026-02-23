import { segmentIntersectsWalls } from "@/vtt/util/segmentIntersectsWall";
import { Wall } from "@/vtt/types/mapData/MapData";

const wall = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  blocksMovement = true
): Wall => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  blocksMovement,
  blocksVision: true,
});

describe("segmentIntersectsWalls", () => {
  it("should return empty array when no walls are crossed", () => {
    const walls = [wall(0, 5, 0, 10)]; // vertical wall at x=0
    const result = segmentIntersectsWalls({ x: 1, y: 0 }, { x: 1, y: 10 }, walls);
    expect(result).toEqual([]);
  });

  it("should detect intersection with a perpendicular wall", () => {
    const walls = [wall(0, 5, 10, 5)]; // horizontal wall at y=5
    const result = segmentIntersectsWalls({ x: 5, y: 0 }, { x: 5, y: 10 }, walls);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeCloseTo(5);
    expect(result[0].y).toBeCloseTo(5);
  });

  it("should detect intersection with a diagonal wall", () => {
    const walls = [wall(0, 0, 10, 10)]; // diagonal wall
    const result = segmentIntersectsWalls({ x: 0, y: 10 }, { x: 10, y: 0 }, walls);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeCloseTo(5);
    expect(result[0].y).toBeCloseTo(5);
  });

  it("should return empty array for parallel segments", () => {
    const walls = [wall(0, 5, 10, 5)]; // horizontal wall
    const result = segmentIntersectsWalls({ x: 0, y: 3 }, { x: 10, y: 3 }, walls);
    expect(result).toEqual([]);
  });

  it("should detect multiple wall crossings", () => {
    const walls = [
      wall(3, 0, 3, 10), // vertical wall at x=3
      wall(7, 0, 7, 10), // vertical wall at x=7
    ];
    const result = segmentIntersectsWalls({ x: 0, y: 5 }, { x: 10, y: 5 }, walls);
    expect(result).toHaveLength(2);
  });

  it("should ignore walls that don't block movement", () => {
    const walls = [wall(0, 5, 10, 5, false)]; // non-blocking wall
    const result = segmentIntersectsWalls({ x: 5, y: 0 }, { x: 5, y: 10 }, walls);
    expect(result).toEqual([]);
  });

  it("should return empty array when segments don't reach the wall", () => {
    const walls = [wall(0, 5, 10, 5)]; // horizontal wall at y=5
    const result = segmentIntersectsWalls({ x: 5, y: 0 }, { x: 5, y: 3 }, walls);
    expect(result).toEqual([]);
  });

  it("should return empty array with empty walls array", () => {
    const result = segmentIntersectsWalls({ x: 0, y: 0 }, { x: 10, y: 10 }, []);
    expect(result).toEqual([]);
  });
});
