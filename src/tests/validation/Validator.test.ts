import {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  SizeValidator,
  ArrayValidator,
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
    /* @ts-expect-error */
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
    /* @ts-expect-error */
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
    /* @ts-expect-error */
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
    /* @ts-expect-error */
    expect(validator.validate({ width: "100", height: 200 })).toBe(false);
  });

  it("should validate valid size", () => {
    const validator = new SizeValidator().isValid();
    expect(validator.validate({ width: 100, height: 200 })).toBe(true);
    expect(validator.validate({ width: 0, height: 200 })).toBe(false);
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
    /* @ts-expect-error */
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
});
