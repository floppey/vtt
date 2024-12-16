import { clamp } from "@/util/clamp";

describe("clamp", () => {
  it("should clamp value within range", () => {
    expect(clamp({ min: 0, max: 10, value: 5 })).toBe(5);
    expect(clamp({ min: 0, max: 10, value: -5 })).toBe(0);
    expect(clamp({ min: 0, max: 10, value: 15 })).toBe(10);
    expect(clamp({ min: 0, max: 10, value: 123456 })).toBe(10); // It handles values much larger than the range
  });

  it("should use default value if value is null or undefined", () => {
    expect(clamp({ min: 0, max: 10, value: null, defaultValue: 5 })).toBe(5);
    expect(clamp({ min: 0, max: 10, value: undefined, defaultValue: 5 })).toBe(
      5
    );
  });

  it("should not use default value if value is 0", () => {
    expect(clamp({ min: 0, max: 10, value: 0, defaultValue: 5 })).toBe(0);
  });

  it("should loop value if loop is true", () => {
    expect(clamp({ min: 0, max: 10, value: -1, loop: true })).toBe(10);
    expect(clamp({ min: 0, max: 10, value: 11, loop: true })).toBe(0);
    expect(clamp({ min: 0, max: 10, value: -5, loop: true })).toBe(6); // -5 is 5 less than min, so it loops to 10 -> 9 -> 8 -> 7 -> 6
    expect(clamp({ min: 0, max: 10, value: 15, loop: true })).toBe(4); // 15 is 5 more than max, so it loops to 0 -> 1 -> 2 -> 3 -> 4
    expect(clamp({ min: 0, max: 10, value: 123456, loop: true })).toBe(3); // It handles values much larger than the range
  });

  it("should handle edge cases", () => {
    expect(clamp({ min: 0, max: 10, value: 0 })).toBe(0);
    expect(clamp({ min: 0, max: 10, value: 10 })).toBe(10);
    expect(clamp({ min: 0, max: 10, value: 0, loop: true })).toBe(0);
    expect(clamp({ min: 0, max: 10, value: 10, loop: true })).toBe(10);
  });
});
