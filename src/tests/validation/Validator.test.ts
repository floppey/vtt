import {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  SizeValidator,
  ArrayValidator,
  CoordinatesValidator,
  GridPositionValidator,
  ObjectValidator,
} from "@/validation/Validator";

describe("StringValidator", () => {
  it("should validate required string", () => {
    const validator = new StringValidator().isRequired();
    expect(validator.validate("test")).toBe(true);
    expect(validator.validate("")).toBe(false);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional string", () => {
    const validator = new StringValidator().isString(true);
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
});

describe("NumberValidator", () => {
  it("should validate required number", () => {
    const validator = new NumberValidator().isRequired();
    expect(validator.validate(123)).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional number", () => {
    const validator = new NumberValidator().isNumber(true);
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
    const validator = new BooleanValidator().isRequired();
    expect(validator.validate(true)).toBe(true);
    expect(validator.validate(false)).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional boolean", () => {
    const validator = new BooleanValidator().isBoolean(true);
    expect(validator.validate(true)).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error value should be a boolean, but is a string */
    expect(validator.validate("true")).toBe(false);
  });
});

describe("SizeValidator", () => {
  it("should validate required size", () => {
    const validator = new SizeValidator().isRequired();
    expect(validator.validate({ width: 100, height: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional size", () => {
    const validator = new SizeValidator().isSize(true);
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
    const validator = new CoordinatesValidator().isRequired();
    expect(validator.validate({ x: 100, y: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional coordinates", () => {
    const validator = new CoordinatesValidator().isCoordinates(true);
    expect(validator.validate({ x: 100, y: 200 })).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error x should be a number, but is a string */
    expect(validator.validate({ x: "100", y: 200 })).toBe(false);
  });
});

describe("GridPositionValidator", () => {
  it("should validate required grid position", () => {
    const validator = new GridPositionValidator().isRequired();
    expect(validator.validate({ row: 1, col: 2 })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional grid position", () => {
    const validator = new GridPositionValidator().isGridPosition(true);
    expect(validator.validate({ row: 1, col: 2 })).toBe(true);
    expect(validator.validate(undefined)).toBe(true);
    /* @ts-expect-error row should be a number, but is a string */
    expect(validator.validate({ row: "1", col: 2 })).toBe(false);
  });
});

describe("ArrayValidator", () => {
  it("should validate required array", () => {
    const validator = new ArrayValidator().isRequired();
    expect(validator.validate([1, 2, 3])).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate optional array", () => {
    const validator = new ArrayValidator().isArray(true);
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
    const validator = new ObjectValidator().isRequired();
    expect(validator.validate({ key: "value" })).toBe(true);
    expect(validator.validate(undefined)).toBe(false);
  });

  it("should validate object with field validator", () => {
    const validator = new ObjectValidator<{ key: string }>().addFieldValidator(
      "key",
      new StringValidator().isRequired()
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
        new StringValidator().isRequired()
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
