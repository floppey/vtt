import { Wall } from "@/vtt/types/mapData/MapData";
import { Coordinates } from "@/vtt/types/types";

/** Check if two coordinates are equal */
const coordinatesAreEqual = (
  coord1: Coordinates,
  coord2: Coordinates
): boolean => coord1.x === coord2.x && coord1.y === coord2.y;

/** Check if two walls are connected */
const wallsAreConnected = (wall1: Wall, wall2: Wall): boolean => {
  return (
    coordinatesAreEqual(wall1.start, wall2.start) ||
    coordinatesAreEqual(wall1.start, wall2.end) ||
    coordinatesAreEqual(wall1.end, wall2.start) ||
    coordinatesAreEqual(wall1.end, wall2.end)
  );
};

/** Check if two walls are parallel */
const wallsAreParalell = (wall1: Wall, wall2: Wall): boolean => {
  const wall1Direction = {
    x: wall1.end.x - wall1.start.x,
    y: wall1.end.y - wall1.start.y,
  };
  const wall2Direction = {
    x: wall2.end.x - wall2.start.x,
    y: wall2.end.y - wall2.start.y,
  };

  return (
    wall1Direction.x * wall2Direction.y === wall1Direction.y * wall2Direction.x
  );
};

/** Merge walls that are parallel and connected at a point */
export const mergeWalls = (walls: Wall[]): Wall[] => {
  const mergedWalls: Wall[] = [];
  const usedWalls = new Set<number>();

  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];

    if (usedWalls.has(i)) {
      continue;
    }

    const mergedWall: Wall = { ...wall };

    for (let j = i + 1; j < walls.length; j++) {
      if (usedWalls.has(j)) {
        continue;
      }

      const otherWall = walls[j];

      if (
        otherWall.blocksMovement !== wall.blocksMovement ||
        otherWall.blocksVision !== wall.blocksVision ||
        !wallsAreConnected(wall, otherWall) ||
        !wallsAreParalell(wall, otherWall)
      ) {
        continue;
      }

      if (coordinatesAreEqual(wall.end, otherWall.start)) {
        mergedWall.end = otherWall.end;
        usedWalls.add(j);
      } else if (coordinatesAreEqual(wall.start, otherWall.end)) {
        mergedWall.start = otherWall.start;
        usedWalls.add(j);
      } else if (coordinatesAreEqual(wall.start, otherWall.start)) {
        mergedWall.start = otherWall.end;
        usedWalls.add(j);
      } else if (coordinatesAreEqual(wall.end, otherWall.end)) {
        mergedWall.end = otherWall.start;
        usedWalls.add(j);
      }
    }

    mergedWalls.push(mergedWall);
  }

  if (mergedWalls.length !== walls.length) {
    return mergeWalls(mergedWalls);
  }

  return mergedWalls;
};
