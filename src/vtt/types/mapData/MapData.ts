import { Coordinates, Size } from "../types";

export type ImageType = "url" | "jpg" | "jpeg" | "png" | "gif" | "webp";

/**
 * MapData is the data structure used in this VTT to store map data.
 * Other formats can be converted to this format for use in the VTT.
 */
export interface MapData {
  /**
   * The name of the map.
   */
  name?: string;

  /**
   * The height and width of the map in pixels.
   */
  size: Size;

  /**
   * The size of each grid cell in pixels.
   */
  cellSize: Size;

  /**
   * The x and y offset of the grid in pixels, if it doesn't align perfectly.
   */
  offset: Coordinates;

  /**
   * The distance represented by one grid cell in-game units.
   */
  gridDistance: Size;

  /**
   * The unit of measurement for the grid (e.g., "ft" for feet).
   */
  gridUnits: string;

  /**
   * Extra space around the map image in pixels.
   */
  padding: number;

  /**
   * The hex color for the grid lines.
   */
  gridColor: string;

  /**
   * The transparency of the grid lines (1.0 is opaque, 0.0 is fully transparent).
   */
  gridAlpha: number;

  /**
   * Whether global illumination is enabled for the map.
   */
  globalLight: boolean;

  /**
   * The level of darkness on the map, ranging from 0.0 (fully lit) to 1.0 (completely dark).
   */
  darkness: number;

  /**
   * An array of light sources defined on the map.
   */
  lights: Light[];

  /**
   * An array of walls and doors defined on the map.
   */
  walls: Wall[];

  /**
   * An array of doors defined on the map.
   */
  doors: Door[];

  /**
   * The background image file path or URL for the map, if applicable.
   */
  backgroundImage: string | null;

  /**
   * The type of the background image.
   */
  backgroundImageType: ImageType;
}

/**
 * Represents a light source on the map.
 */
export interface Light {
  /**
   * The x and y coordinates of the light on the map.
   */
  position: Coordinates;

  /**
   * The radius of dim light emitted by the source in game units.
   */
  dim: number;

  /**
   * The radius of bright light emitted by the source in game units.
   */
  bright: number;

  /**
   * The hex color of the light.
   */
  tintColor: string;

  /**
   * The transparency of the light's color (0.0 is fully transparent).
   */
  tintAlpha: number;
}

/**
 * Represents a wall or door on the map.
 */
export interface Wall {
  /**
   * The start coordinates of the wall.
   */
  start: Coordinates;
  /**
   * The  end coordinates of the wall.
   */
  end: Coordinates;

  /**
   * Whether the wall blocks movement.
   */
  blocksMovement: boolean;

  /**
   * Whether the wall blocks vision.
   */
  blocksVision: boolean;
}

/**
 * Represents a door on the map.
 */
export interface Door {
  /**
   * The start coordinates of the door.
   */
  start: Coordinates;
  /**
   * The  end coordinates of the door.
   */
  end: Coordinates;

  /**
   * Whether the door blocks vision.
   */
  blocksVision: boolean;

  /**
   * Whether the door is open or closed.
   */
  isOpen: boolean;

  /**
   * Whether the door is locked.
   */
  isLocked: boolean;
}
