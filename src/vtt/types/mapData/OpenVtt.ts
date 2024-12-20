import { Coordinates } from "../types";

interface Resolution {
  /** NB! Coordinates are based on grid cells, not pixels */
  map_origin: Coordinates;
  /** NB! Coordinates are based on grid cells, not pixels */
  map_size: Coordinates;
  pixels_per_grid: number;
}

interface Portal {
  /** NB! Coordinates are based on grid cells, not pixels */
  position: Coordinates;
  /** NB! Coordinates are based on grid cells, not pixels */
  bounds: Coordinates[];
  rotation: number;
  closed: boolean;
  freestanding: boolean;
}

interface Light {
  /** NB! Coordinates are based on grid cells, not pixels */
  position: Coordinates;
  range: number;
  intensity: number;
  color: string;
  shadows: boolean;
}

interface Environment {
  baked_lighting: boolean;
  ambient_light: string;
}

/**
 * OpenVtt is a file format for storing map data. Many different map making tools can export to this format.
 * More information can be found at https://arkenforge.com/universal-vtt-files/
 */
export interface OpenVtt {
  format: number;
  resolution: Resolution;
  /** NB! Coordinates are based on grid cells, not pixels */
  line_of_sight: Coordinates[][];
  /** NB! Coordinates are based on grid cells, not pixels */
  objects_line_of_sight: Coordinates[][];
  portals: Portal[];
  lights: Light[];
  environment: Environment;
  image: string;
}
