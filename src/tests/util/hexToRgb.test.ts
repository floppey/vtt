import { hexToRgb } from "@/util/hexToRgb";

describe("hexToRgb", () => {
  it("should convert 6-character hex to RGB", () => {
    const result = hexToRgb("#FFFFFF");
    expect(result.a).toBe(1);
    expect(result.r).toBe(255);
    expect(result.g).toBe(255);
    expect(result.b).toBe(255);
  });

  it("should convert 6-character hex to RGB", () => {
    const result = hexToRgb("#ff5733");
    expect(result.a).toBe(1);
    expect(result.r).toBe(255);
    expect(result.g).toBe(87);
    expect(result.b).toBe(51);
  });

  it("should convert 3-character hex to RGB", () => {
    const result = hexToRgb("#000");
    expect(result.a).toBe(1);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it("should convert 8-character hex to RGBA", () => {
    const result = hexToRgb("#ff573380");
    expect(result.a).toBeCloseTo(0.5);
    expect(result.r).toBe(255);
    expect(result.g).toBe(87);
    expect(result.b).toBe(51);
  });

  it("should convert 4-character hex to RGBA", () => {
    const result = hexToRgb("#f538");
    expect(result.a).toBeCloseTo(0.5, 1);
    expect(result.r).toBe(255);
    expect(result.g).toBe(85);
    expect(result.b).toBe(51);
  });

  it("should handle hex without #", () => {
    const result = hexToRgb("FFFFFF");
    expect(result.a).toBe(1);
    expect(result.r).toBe(255);
    expect(result.g).toBe(255);
    expect(result.b).toBe(255);
  });

  it("should return black for invalid hex input", () => {
    const result = hexToRgb("invalid");
    expect(result.a).toBe(1);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });
});
