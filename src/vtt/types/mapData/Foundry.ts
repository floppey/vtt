/**
 * Represents a map exported for Foundry VTT.
 */
export interface Foundry {
  /**
   * The name of the map.
   */
  name: string;

  /**
   * The width of the map in pixels.
   */
  width: number;

  /**
   * The height of the map in pixels.
   */
  height: number;

  /**
   * The size of each grid cell in pixels.
   */
  grid: number;

  /**
   * The horizontal offset of the grid in pixels, if it doesn't align perfectly.
   */
  shiftX: number;

  /**
   * The vertical offset of the grid in pixels, if it doesn't align perfectly.
   */
  shiftY: number;

  /**
   * The distance represented by one grid cell in-game units.
   */
  gridDistance: number;

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
  lights: FoundryLight[];

  /**
   * An array of walls and doors defined on the map.
   */
  walls: FoundryWall[];

  /**
   * The background image file path or URL for the map, if applicable.
   */
  img: string | null;

  /**
   * The foreground image file path or URL for the map, if applicable.
   */
  foreground: string | null;
}

/**
 * Represents a light source on the map.
 */
interface FoundryLight {
  /**
   * The x-coordinate of the light on the map.
   */
  x: number;

  /**
   * The y-coordinate of the light on the map.
   */
  y: number;

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
interface FoundryWall {
  /**
   * An array of coordinates defining the wall's start and end points.
   * Format: [x1, y1, x2, y2].
   */
  c: [number, number, number, number];

  /**
   * Whether the wall blocks movement (1 for blocking, 0 for allowing movement).
   */
  move: number;

  /**
   * Whether the wall blocks vision (1 for blocking, 0 for allowing vision).
   */
  sense: number;

  /**
   * Whether the wall blocks sound (1 for blocking, 0 for allowing sound).
   */
  sound: number;

  /**
   * Indicates if the wall is a door and its state:
   * 0 = Not a door,
   * 1 = Closed door,
   * 2 = Open door.
   */
  door: number;
}
