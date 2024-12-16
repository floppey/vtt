import { TypeValidator, validateJsonType } from "@/util/validateJsonType";

class TestType {
  prop1: string = "";
  prop2: number = 0;
  prop3?: boolean;
}

describe("validateJsonType", () => {
  const validator: TypeValidator<TestType> = {
    prop1: (value) => typeof value === "string",
    prop2: (value) => typeof value === "number",
    prop3: (value) => value === undefined || typeof value === "boolean",
  };
  it("should return true for valid JSON matching the expected type", () => {
    const testObject: TestType = {
      prop1: "test",
      prop2: 123,
      prop3: true,
    };
    const jsonString = JSON.stringify(testObject);
    const result = validateJsonType(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return true for valid JSON matching the expected type, when optional parameters are unset", () => {
    const testObject: TestType = {
      prop1: "test",
      prop2: 123,
    };
    const jsonString = JSON.stringify(testObject);
    const result = validateJsonType(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return true for valid JSON matching the expected type, even when additional props are present", () => {
    const jsonString = JSON.stringify({
      prop1: "test",
      prop2: 123,
      prop99: "extra prop",
    });
    const result = validateJsonType(jsonString, validator);
    expect(result.isValid).toBe(true);
  });

  it("should return false for JSON missing required properties", () => {
    const jsonString = JSON.stringify({ prop1: "test" });
    const result = validateJsonType(jsonString, validator);
    expect(result.isValid).toBe(false);
  });

  it("should return false for JSON with incorrect property types", () => {
    const jsonString = JSON.stringify({
      prop1: "test",
      prop2: 123,
      prop3: "not a boolean",
    });
    const result = validateJsonType(jsonString, validator);
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
      const result = validateJsonType(jsonString, validator);
      expect(result.isValid).toBe(false);
    });
  });

  it("should return all validation messages for invalid JSON strings", () => {
    const invalidObject = {
      prop1: 123,
      prop3: "not a boolean",
    };
    const result = validateJsonType(JSON.stringify(invalidObject), validator);
    expect(
      result.messages.some(
        (message) =>
          message ===
          `Validation failed for key prop1: Invalid value "123" (number)`
      )
    ).toBe(true);
    expect(
      result.messages.some(
        (message) => message === "Missing required key: prop2"
      )
    ).toBe(true);
    expect(
      result.messages.some(
        (message) =>
          message ===
          `Validation failed for key prop3: Invalid value "not a boolean" (string)`
      )
    ).toBe(true);
  });
});
