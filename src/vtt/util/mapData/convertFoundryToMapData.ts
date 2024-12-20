import { Foundry } from "@/vtt/types/mapData/Foundry";
import { MapData, Light, Wall, Door } from "@/vtt/types/mapData/MapData";
import { Size, Coordinates } from "@/vtt/types/types";

export const convertFoundryToMapData = (foundry: Foundry): MapData => {
  const cellSize: Size = {
    width: foundry.grid,
    height: foundry.grid,
  };

  const gridDistance: Size = {
    width: foundry.gridDistance,
    height: foundry.gridDistance,
  };

  const offset: Coordinates = {
    x: foundry.shiftX,
    y: foundry.shiftY,
  };

  const size: Size = {
    width: foundry.width,
    height: foundry.height,
  };

  const lights: Light[] =
    foundry.lights?.map((foundryLight): Light => {
      const position: Coordinates = {
        x: foundryLight.x,
        y: foundryLight.y,
      };

      const light: Light = {
        position,
        bright: (foundryLight.bright / foundry.gridDistance) * foundry.grid,
        dim: (foundryLight.dim / foundry.gridDistance) * foundry.grid,
        tintColor: foundryLight.tintColor,
        tintAlpha: foundryLight.tintAlpha,
      };
      return light;
    }) ?? [];

  const walls: Wall[] =
    foundry.walls
      ?.filter((wall) => wall.door === 0)
      .map((foundryWall): Wall => {
        const start: Coordinates = {
          x: foundryWall.c[0],
          y: foundryWall.c[1],
        };
        const end: Coordinates = {
          x: foundryWall.c[2],
          y: foundryWall.c[3],
        };

        const wall: Wall = {
          start,
          end,
          blocksVision: foundryWall.sense === 1,
          blocksMovement: foundryWall.move === 1,
        };
        return wall;
      }) ?? [];

  const doors: Door[] =
    foundry.walls
      ?.filter((wall) => [1, 2].includes(wall.door))
      .map((foundryDoor): Door => {
        const start: Coordinates = {
          x: foundryDoor.c[0],
          y: foundryDoor.c[1],
        };
        const end: Coordinates = {
          x: foundryDoor.c[2],
          y: foundryDoor.c[3],
        };

        const door: Door = {
          start,
          end,
          isOpen: foundryDoor.door === 2,
          isLocked: false,
          blocksVision: foundryDoor.sense === 1,
        };
        return door;
      }) ?? [];

  const mapData: MapData = {
    name: foundry.name,
    size,
    cellSize,
    offset,
    gridDistance,
    gridUnits: foundry.gridUnits,
    padding: foundry.padding,
    gridColor: foundry.gridColor,
    gridAlpha: foundry.gridAlpha,
    globalLight: foundry.globalLight,
    darkness: foundry.darkness,
    lights,
    backgroundImage: foundry.img,
    backgroundImageType: "jpg",
    walls,
    doors,
  };

  return mapData;
};
