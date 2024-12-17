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

export const mapDataValidator: TypeValidator<MapData> = {
  format: new NumberValidator("format must be a number").isNumber(),
  line_of_sight: new ArrayValidator<Coordinates[]>(
    "line_of_sight must be an array"
  )
    .isRequired()
    .isArray()
    .isNotEmpty(),
  resolution: new ObjectValidator<MapData["resolution"]>(
    "resolution must be an object with map_origin and map_size"
  ).addFieldValidator(
    "map_origin",
    new CoordinatesValidator("map_origin must be an object with x and y")
  ),
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
