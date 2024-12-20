import { Door, Light, MapData, Wall } from "@/vtt/types/mapData/MapData";
import { OpenVtt } from "@/vtt/types/mapData/OpenVtt";
import { Coordinates, Size } from "@/vtt/types/types";

export const convertOpenVttToMapData = (openVtt: OpenVtt): MapData => {
  const cellSize: Size = {
    width: openVtt.resolution.pixels_per_grid,
    height: openVtt.resolution.pixels_per_grid,
  };

  const offset: Coordinates = {
    x: openVtt.resolution.map_origin.x * cellSize.width,
    y: openVtt.resolution.map_origin.y * cellSize.height,
  };

  const size: Size = {
    width: openVtt.resolution.map_size.x * cellSize.width,
    height: openVtt.resolution.map_size.y * cellSize.height,
  };

  const lights: Light[] =
    openVtt.lights?.map((openVttLight): Light => {
      const position: Coordinates = {
        x: openVttLight.position.x * cellSize.width,
        y: openVttLight.position.y * cellSize.height,
      };

      const light: Light = {
        position,
        bright:
          openVttLight.intensity >= 1
            ? openVttLight.range * Math.max(cellSize.width, cellSize.height)
            : 0,
        dim:
          openVttLight.intensity >= 1
            ? 0
            : openVttLight.range * Math.max(cellSize.width, cellSize.height),
        tintColor: openVttLight.color,
        tintAlpha: 1,
      };
      return light;
    }) ?? [];

  const walls: Wall[] = [
    ...(openVtt.line_of_sight ?? []),
    ...(openVtt.objects_line_of_sight ?? []),
  ].map((line: Coordinates[]) => {
    const start: Coordinates = {
      x: line[0].x * cellSize.width,
      y: line[0].y * cellSize.height,
    };
    const end: Coordinates = {
      x: line[1].x * cellSize.width,
      y: line[1].y * cellSize.height,
    };

    const wall: Wall = { start, end, blocksVision: true, blocksMovement: true };
    return wall;
  });

  const doors: Door[] =
    openVtt.portals?.map((portal) => {
      const start: Coordinates = {
        x: portal.bounds[0].x * cellSize.width,
        y: portal.bounds[0].y * cellSize.height,
      };
      const end: Coordinates = {
        x: portal.bounds[1].x * cellSize.width,
        y: portal.bounds[1].y * cellSize.height,
      };

      const door: Door = {
        start,
        end,
        isOpen: !portal.closed,
        isLocked: false,
        blocksVision: true,
      };
      return door;
    }) ?? [];

  const mapData: MapData = {
    name: undefined,
    size,
    cellSize,
    offset,
    gridDistance: { width: 5, height: 5 },
    gridUnits: "ft",
    padding: 0,
    gridColor: "#000000",
    gridAlpha: 1,
    globalLight: !openVtt.environment.baked_lighting,
    darkness: 0,
    lights,
    backgroundImage: openVtt.image,
    backgroundImageType: "jpg",
    walls,
    doors,
  };

  return mapData;
};
