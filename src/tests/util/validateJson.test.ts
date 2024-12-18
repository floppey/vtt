import { validateJson } from "@/validation/validateJson";
import {
  BooleanValidator,
  NumberValidator,
  StringValidator,
  TypeValidator,
} from "@/validation/Validator";

class TestType {
  prop1: string = "";
  prop2: number = 0;
  prop3?: boolean;
}

describe("validateJson", () => {
  const validator: TypeValidator<TestType> = {
    prop1: new StringValidator({ errorMessage: "prop1 must be a string" })
      .isString()
      .isNotEmpty(),
    prop2: new NumberValidator({
      errorMessage: "prop2 must be a number",
    }).isNumber(),
    prop3: new BooleanValidator({
      errorMessage: "prop3 must be a boolean, or unset",
      isOptional: true,
    }).isBoolean(),
  };
  it("should return true for valid JSON matching the expected type", () => {
    const testObject: TestType = {
      prop1: "test",
      prop2: 123,
      prop3: true,
    };
    const jsonString = JSON.stringify(testObject);
    const result = validateJson(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return true for valid JSON matching the expected type, when optional parameters are unset", () => {
    const testObject: TestType = {
      prop1: "test",
      prop2: 123,
    };
    const jsonString = JSON.stringify(testObject);
    const result = validateJson(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return true for valid JSON matching the expected type, even when additional props are present", () => {
    const jsonString = JSON.stringify({
      prop1: "test",
      prop2: 123,
      prop99: "extra prop",
    });
    const result = validateJson(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return false for JSON missing required properties", () => {
    const jsonString = JSON.stringify({ prop1: "test" });
    const result = validateJson(jsonString, validator);
    expect(result.isValid).toBe(false);
  });

  it("should return false for JSON with incorrect property types", () => {
    const jsonString = JSON.stringify({
      prop1: "test",
      prop2: 123,
      prop3: "not a boolean",
    });
    const result = validateJson(jsonString, validator);
    expect(result.isValid).toBe(false);
  });

  it("should return false for invalid JSON strings", () => {
    const invalidJsonStrings = [
      '{ prop1: "test", prop2: 123',
      "null",
      "undefined",
      undefined,
      null,
    ];
    invalidJsonStrings.forEach((jsonString) => {
      const result = validateJson(jsonString, validator);
      expect(result.isValid).toBe(false);
    });
  });

  it("should return all validation messages for invalid JSON strings", () => {
    const invalidObject = {
      prop1: 123,
      prop3: "not a boolean",
    };
    const result = validateJson(JSON.stringify(invalidObject), validator);
    expect(result.messages.length).toBe(3);
  });
});
