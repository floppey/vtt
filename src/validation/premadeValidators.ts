import { MapData, MapSettings } from "@/context/mapSettingsContext";
import { Coordinates } from "@/vtt/types/types";
import {
  TypeValidator,
  NumberValidator,
  ArrayValidator,
  ObjectValidator,
  CoordinatesValidator,
  SizeValidator,
  StringValidator,
} from "./Validator";
import { User } from "@/context/userContext";

const resolutionValidator = new ObjectValidator<MapData["resolution"]>(
  "resolution must be an object with map_origin, map_size and pixels_per_grid"
)
  .addFieldValidator(
    "map_origin",
    new CoordinatesValidator("map_origin must be coordinates")
      .isRequired()
      .isCoordinates()
  )
  .addFieldValidator(
    "map_size",
    new CoordinatesValidator("map_size must be coordinates")
      .isRequired()
      .isCoordinates()
  )
  .addFieldValidator(
    "pixels_per_grid",
    new NumberValidator("pixels_per_grid must be a number")
      .isRequired()
      .isNumber()
  );

const lineOfSightValidator = new ArrayValidator<Coordinates[]>(
  "line_of_sight must be an array of coordinates arrays"
)
  .isRequired()
  .isArray()
  .isNotEmpty()
  .hasValidElements(
    new ArrayValidator<Coordinates>(
      "line_of_sight[x] must be an array of coordinates"
    )
      .isRequired()
      .isArray()
      .isNotEmpty()
      .hasValidElements(
        new CoordinatesValidator("line_of_sight[x][y] must be coordinates")
          .isRequired()
          .isCoordinates()
      )
  );

export const mapDataValidator: TypeValidator<MapData> = {
  format: new NumberValidator("format must be a number").isNumber(),
  line_of_sight: lineOfSightValidator,
  resolution: resolutionValidator,
};

export const mapSettingsValidator: TypeValidator<MapSettings> = {
  backgroundImage: new StringValidator("backgroundImage must be a string")
    .isRequired()
    .isString(),
  gridSize: new SizeValidator(
    "gridSize must be a Size object with width and height greater than 0"
  )
    .isRequired()
    .isSize()
    .isValid(),
  xOffset: new NumberValidator("xOffset must be a number")
    .isRequired()
    .isNumber(),
  yOffset: new NumberValidator("yOffset must be a number")
    .isRequired()
    .isNumber(),
  gridColor: new StringValidator("gridColor must be a string")
    .isRequired()
    .isString()
    .matchesRegex(/^(#[0-9A-F]{6}|rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\))$/i),
};

export const userSettingValidator: TypeValidator<User> = {
  id: new StringValidator("id must be a string").isRequired().isString(),
  name: new StringValidator("name must be a string").isRequired().isString(),
  color: new StringValidator("color must be a string").isRequired().isString(),
};
