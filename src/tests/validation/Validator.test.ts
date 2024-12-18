import {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  SizeValidator,
  ArrayValidator,
  CoordinatesValidator,
  GridPositionValidator,
  ObjectValidator,
  Validator,
} from "@/validation/Validator";

describe("Validator", () => {
  it("should validate that something is defined", () => {
    const validator = new Validator();
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("")).toBe(true);
    expect(validator.validate(0)).toBe(true);
    expect(validator.validate(false)).toBe(true);
    expect(validator.validate([])).toBe(true);
    expect(validator.validate({})).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
    expect(validator.validate(null)).toBe(false);
  });
  it("should validate that something is defined, undefined or null if it is optional", () => {
    const validator = new Validator({ isOptional: true });
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("")).toBe(true);
    expect(validator.validate(0)).toBe(true);
    expect(validator.validate(false)).toBe(true);
    expect(validator.validate([])).toBe(true);
    expect(validator.validate({})).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    expect(validator.validate(null)).toBe(true);
  });
  it("should validate using a custom validation function", () => {
    const validator = new Validator<string>().customValidation(
      (value) => value === "test"
    );
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("not test")).toBe(false);
  });
});

describe("StringValidator", () => {
  it("should validate required string", () => {
    const validator = new StringValidator().isNotEmpty();
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("")).toBe(false);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional string", () => {
    const validator = new StringValidator({ isOptional: true }).isString();
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    expect(validator.validate("")).toBe(true);
    /* @ts-expect-error value should be a string, but is a number */
    expect(validator.validate(123)).toBe(false);
  });

  it("should validate string with regex", () => {
    const validator = new StringValidator().matchesRegex(/^test$/);
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("notest")).toBe(false);
  });

  it("should validate hex color string", () => {
    const validator = new StringValidator().isHexColor();
    expect(validator.validate("#123456")).toBe(true);
    expect(validator.validate("123456")).toBe(true);
    expect(validator.validate("#FED")).toBe(true);
    expect(validator.validate("fed")).toBe(true);
    expect(validator.validate("ffFFEBCF")).toBe(true);
    expect(validator.validate("#FF575112")).toBe(true);

    expect(validator.validate("#12345")).toBe(false); // 5 characters (not counting #) - hex must be 3, 4, 6 or 8 characters
    expect(validator.validate("#123456789")).toBe(false); // 9 characters (not counting #) - hex must be 3, 4, 6 or 8 characters
    expect(validator.validate("#12345Z")).toBe(false); // Z is not a valid hex character
    expect(validator.validate("")).toBe(false); // empty string
    expect(validator.validate("#")).toBe(false); // only #, no hex characters
    expect(validator.validate(undefined)).toBe(false); // undefined
  });
});

describe("NumberValidator", () => {
  it("should validate required number", () => {
    const validator = new NumberValidator();
    expect(validator.validate(123)).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional number", () => {
    const validator = new NumberValidator({ isOptional: true }).isNumber();
    expect(validator.validate(123)).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error value should be a number, but is a string */
    expect(validator.validate("123")).toBe(false);
  });

  it("should validate integer number", () => {
    const validator = new NumberValidator().isInteger();
    expect(validator.validate(123)).toBe(true);
    expect(validator.validate(123.45)).toBe(false);
  });

  it("should validate positive number", () => {
    const validator = new NumberValidator().isPositive();
    expect(validator.validate(123)).toBe(true);
    expect(validator.validate(-123)).toBe(false);
  });

  it("should validate negative number", () => {
    const validator = new NumberValidator().isNegative();
    expect(validator.validate(-123)).toBe(true);
    expect(validator.validate(123)).toBe(false);
  });
});

describe("BooleanValidator", () => {
  it("should validate required boolean", () => {
    const validator = new BooleanValidator();
    expect(validator.validate(true)).toBe(true);
    expect(validator.validate(false)).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional boolean", () => {
    const validator = new BooleanValidator({ isOptional: true }).isBoolean();
    expect(validator.validate(true)).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error value should be a boolean, but is a string */
    expect(validator.validate("true")).toBe(false);
  });
});

describe("SizeValidator", () => {
  it("should validate required size", () => {
    const validator = new SizeValidator();
    expect(validator.validate({ width: 100, height: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional size", () => {
    const validator = new SizeValidator({ isOptional: true }).isSize();
    expect(validator.validate({ width: 100, height: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error width should be a number, but is a string */
    expect(validator.validate({ width: "100", height: 200 })).toBe(false);
  });

  it("should validate valid size", () => {
    const validator = new SizeValidator().isValid();
    expect(validator.validate({ width: 100, height: 200 })).toBe(true);
    expect(validator.validate({ width: 0, height: 200 })).toBe(false);
  });
});

describe("CoordinatesValidator", () => {
  it("should validate required coordinates", () => {
    const validator = new CoordinatesValidator();
    expect(validator.validate({ x: 100, y: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional coordinates", () => {
    const validator = new CoordinatesValidator({
      isOptional: true,
    }).isCoordinates();
    expect(validator.validate({ x: 100, y: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error x should be a number, but is a string */
    expect(validator.validate({ x: "100", y: 200 })).toBe(false);
  });
});

describe("GridPositionValidator", () => {
  it("should validate required grid position", () => {
    const validator = new GridPositionValidator();
    expect(validator.validate({ row: 1, col: 2 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional grid position", () => {
    const validator = new GridPositionValidator({
      isOptional: true,
    }).isGridPosition();
    expect(validator.validate({ row: 1, col: 2 })).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error row should be a number, but is a string */
    expect(validator.validate({ row: "1", col: 2 })).toBe(false);
  });
});

describe("ArrayValidator", () => {
  it("should validate required array", () => {
    const validator = new ArrayValidator();
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional array", () => {
    const validator = new ArrayValidator({ isOptional: true }).isArray();
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error should be an array, but is a string */
    expect(validator.validate("not an array")).toBe(false);
  });

  it("should validate non-empty array", () => {
    const validator = new ArrayValidator().isNotEmpty();
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate([])).toBe(false);
  });

  it("should validate array length", () => {
    const validator = new ArrayValidator().hasLength(3);
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate([1, 2])).toBe(false);
  });

  it("should validate array minimum length", () => {
    const validator = new ArrayValidator().hasMinLength(2);
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate([1])).toBe(false);
  });

  it("should validate array elements", () => {
    const validator = new ArrayValidator<number>().hasValidElements(
      new NumberValidator().isNumber()
    );
    expect(validator.validate([1, 2, 3])).toBe(true);
    /* @ts-expect-error array should only contain numbers, but contains a string */
    expect(validator.validate([1, "2", 3])).toBe(false);
  });
});

describe("ObjectValidator", () => {
  it("should validate required object", () => {
    const validator = new ObjectValidator();
    expect(validator.validate({ key: "value" })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional object properties", () => {
    const validator = new ObjectValidator<{
      prop1?: string;
      prop2: number;
    }>().addFieldValidator(
      "prop1",
      new StringValidator({ isOptional: true }).isNotEmpty()
    );
    expect(validator.validate({ prop1: "value", prop2: 1 })).toBe(true);
    expect(validator.validate({ prop1: undefined, prop2: 1 })).toBe(true);
    expect(validator.validate({ prop2: 1 })).toBe(true);
    /* @ts-expect-error should be an object, but is a string */
    expect(validator.validate("not an object")).toBe(false);
  });

  it("should validate object with field validator", () => {
    const validator = new ObjectValidator<{ key: string }>().addFieldValidator(
      "key",
      new StringValidator().isNotEmpty()
    );
    expect(validator.validate({ key: "value" })).toBe(true);
    expect(validator.validate({ key: "" })).toBe(false);
    /* @ts-expect-error key should be a string, but is a number */
    expect(validator.validate({ key: 24 })).toBe(false);
    /* @ts-expect-error key should be a string, but is missing */
    expect(validator.validate({})).toBe(false);
  });

  it("should allow nested object validators", () => {
    const validator = new ObjectValidator<{
      key: { nested: string };
    }>().addFieldValidator(
      "key",
      new ObjectValidator<{ nested: string }>().addFieldValidator(
        "nested",
        new StringValidator().isNotEmpty()
      )
    );
    expect(validator.validate({ key: { nested: "value" } })).toBe(true);
    expect(validator.validate({ key: { nested: "" } })).toBe(false);
    /* @ts-expect-error nested should be a string, but is a number */
    expect(validator.validate({ key: { nested: 24 } })).toBe(false);
    /* @ts-expect-error nested should be a string, but is missing */
    expect(validator.validate({ key: {} })).toBe(false);
    /* @ts-expect-error key should be an object, but is a string */
    expect(validator.validate({ key: "value" })).toBe(false);
    /* @ts-expect-error key should be an object, but is missing */
    expect(validator.validate({})).toBe(false);
  });
});
