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
  BooleanValidator,
} from "./Validator";
import { User } from "@/context/userContext";

const lightValidator = new ObjectValidator<MapData["lights"][0]>({
  errorMessage:
    "light must be an object with position, range, intensity, color and shadows",
})
  .addFieldValidator(
    "position",
    new CoordinatesValidator({
      errorMessage: "position must be coordinates",
    }).isCoordinates()
  )
  .addFieldValidator(
    "range",
    new NumberValidator({ errorMessage: "range must be a number" }).isNumber()
  )
  .addFieldValidator(
    "intensity",
    new NumberValidator({
      errorMessage: "intensity must be a number",
    }).isNumber()
  )
  .addFieldValidator(
    "color",
    new StringValidator({
      errorMessage: "color must be a hex color code string",
    })
      .isNotEmpty()
      .isHexColor()
  )
  .addFieldValidator(
    "shadows",
    new BooleanValidator({
      errorMessage: "shadows must be a boolean",
    }).isBoolean()
  );

const portalValidator = new ObjectValidator<MapData["portals"][0]>({
  errorMessage:
    "portal must be an object with position, bounds, rotation, closed and freestanding",
})
  .addFieldValidator(
    "position",
    new CoordinatesValidator({
      errorMessage: "position must be coordinates",
    }).isCoordinates()
  )
  .addFieldValidator(
    "bounds",
    new ArrayValidator<Coordinates>({
      errorMessage: "bounds must be an array of coordinates",
    })

      .isArray()
      .isNotEmpty()
      .hasValidElements(
        new CoordinatesValidator({
          errorMessage: "bounds[x] must be an object with x and y",
        }).isCoordinates()
      )
  )
  .addFieldValidator(
    "rotation",
    new NumberValidator({
      errorMessage: "rotation must be a number",
    }).isNumber()
  )
  .addFieldValidator(
    "closed",
    new BooleanValidator({
      errorMessage: "closed must be a boolean",
    }).isBoolean()
  )
  .addFieldValidator(
    "freestanding",
    new BooleanValidator({
      errorMessage: "freestanding must be a boolean",
    }).isBoolean()
  );

const resolutionValidator = new ObjectValidator<MapData["resolution"]>({
  errorMessage:
    "resolution must be an object with map_origin, map_size and pixels_per_grid",
})
  .addFieldValidator(
    "map_origin",
    new CoordinatesValidator({
      errorMessage: "map_origin must be coordinates",
    }).isCoordinates()
  )
  .addFieldValidator(
    "map_size",
    new CoordinatesValidator({
      errorMessage: "map_size must be coordinates",
    }).isCoordinates()
  )
  .addFieldValidator(
    "pixels_per_grid",
    new NumberValidator({
      errorMessage: "pixels_per_grid must be a number",
    }).isNumber()
  );

const lineOfSightValidator = (name: string) =>
  new ArrayValidator<Coordinates[]>({
    errorMessage: `${name} must be an array of coordinates arrays`,
    isOptional: true,
  })
    .isArray()
    .hasValidElements(
      new ArrayValidator<Coordinates>({
        errorMessage: `${name}[x] must be an array of coordinates`,
      })
        .isArray()
        .isNotEmpty()
        .hasValidElements(
          new CoordinatesValidator({
            errorMessage: `${name}[x][y] must be an object with x and y coordinates`,
          }).isCoordinates()
        )
    );

export const mapDataValidator: TypeValidator<MapData> = {
  format: new NumberValidator({
    errorMessage: "format must be a number",
  }).isNumber(),
  resolution: resolutionValidator,
  line_of_sight: lineOfSightValidator("line_of_sight"),
  objects_line_of_sight: lineOfSightValidator("objects_line_of_sight"),
  portals: new ArrayValidator<MapData["portals"][0]>({
    errorMessage: "portals must be an array of objects",
  })
    .isArray()
    .hasValidElements(portalValidator),
  environment: new ObjectValidator<MapData["environment"]>({
    errorMessage:
      "environment must be an object with baked_lighting and ambient_light",
  })
    .addFieldValidator(
      "baked_lighting",
      new BooleanValidator({
        errorMessage: "baked_lighting must be a boolean or undefined",
        isOptional: true,
      }).isBoolean()
    )
    .addFieldValidator(
      "ambient_light",
      new StringValidator({
        errorMessage:
          "ambient_light must be a hex color code string or undefined",
        isOptional: true,
      }).isHexColor()
    ),
  lights: new ArrayValidator<MapData["lights"][0]>({
    errorMessage: "lights must be an array of light objects",
  })
    .isArray()
    .hasValidElements(lightValidator),
  image: new StringValidator({
    errorMessage: "image must be a base64 encoded string",
  })
    .isNotEmpty()
    .isString(),
};

export const mapSettingsValidator: TypeValidator<MapSettings> = {
  backgroundImage: new StringValidator({
    errorMessage: "backgroundImage must be a string",
  })
    .isNotEmpty()
    .isString(),
  gridSize: new SizeValidator({
    errorMessage:
      "gridSize must be a Size object with width and height greater than 0",
  })
    .isSize()
    .isValid(),
  xOffset: new NumberValidator({
    errorMessage: "xOffset must be a number",
  }).isNumber(),
  yOffset: new NumberValidator({
    errorMessage: "yOffset must be a number",
  }).isNumber(),
  gridColor: new StringValidator({ errorMessage: "gridColor must be a string" })
    .isNotEmpty()
    .isString()
    .matchesRegex(/^(#[0-9A-F]{6}|rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\))$/i),
};

export const userSettingValidator: TypeValidator<User> = {
  id: new StringValidator({ errorMessage: "id must be a string" })
    .isNotEmpty()
    .isString(),
  name: new StringValidator({ errorMessage: "name must be a string" })
    .isNotEmpty()
    .isString(),
  color: new StringValidator({ errorMessage: "color must be a string" })
    .isNotEmpty()
    .isString(),
};
