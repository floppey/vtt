import { mergeWalls } from "@/vtt/util/mapData/mergeWalls";
import { Wall } from "@/vtt/types/mapData/MapData";

describe("mergeWalls", () => {
  it("should merge two connected and parallel walls", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 2, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual([
      {
        start: { x: 0, y: 0 },
        end: { x: 2, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ]);
  });

  it("should merge walls that are connected at the start", () => {
    const walls: Wall[] = [
      {
        start: { x: 1, y: 0 },
        end: { x: 0, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 2, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual([
      {
        start: { x: 2, y: 0 },
        end: { x: 0, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ]);
  });

  it("should merge walls that move in x and y", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 1 },
        end: { x: 2, y: 2 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual([
      {
        start: { x: 0, y: 0 },
        end: { x: 2, y: 2 },
        blocksMovement: true,
        blocksVision: true,
      },
    ]);
  });

  it("should not merge walls that are not connected", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 2, y: 0 },
        end: { x: 3, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual(walls);
  });

  it("should not merge walls that are not parallel", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual(walls);
  });

  it("should merge multiple connected and parallel walls", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 2, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 2, y: 0 },
        end: { x: 3, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual([
      {
        start: { x: 0, y: 0 },
        end: { x: 3, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ]);
  });

  it("should not merge walls with different properties", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 2, y: 0 },
        blocksMovement: false,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual(walls);
  });

  it("should handle walls that form a loop", () => {
    const walls: Wall[] = [
      {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 1, y: 1 },
        end: { x: 0, y: 1 },
        blocksMovement: true,
        blocksVision: true,
      },
      {
        start: { x: 0, y: 1 },
        end: { x: 0, y: 0 },
        blocksMovement: true,
        blocksVision: true,
      },
    ];

    const result = mergeWalls(walls);

    expect(result).toEqual(walls);
  });
});
