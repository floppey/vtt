import { TypeValidator } from "@/util/validateJsonType";
import { tryParseJson } from "../../util/tryParseJson";

interface TestType {
  key: string;
}

describe("tryParseJson", () => {
  const mockValidator: TypeValidator<TestType> = {
    key: (value) => typeof value === "string",
  };

  it("should return parsed JSON object when JSON is valid", () => {
    const jsonString = '{"key": "value"}';
    const result = tryParseJson(jsonString, mockValidator);
    expect(result).toEqual({ key: "value" });
  });

  it("should return null when JSON is invalid", () => {
    const jsonString = '{"key": "value"';
    const result = tryParseJson(jsonString, mockValidator);
    expect(result).toBeNull();
  });

  it("should return null when jsonString is null", () => {
    const result = tryParseJson(null, mockValidator);
    expect(result).toBeNull();
  });

  it("should return null when jsonString is undefined", () => {
    const result = tryParseJson(undefined, mockValidator);
    expect(result).toBeNull();
  });
});
