import { resolvePath, resolveMultiSegmentPath } from "@/vtt/util/resolvePath";

describe("resolvePath", () => {
  it("should return single position when start equals end", () => {
    const result = resolvePath({ row: 3, col: 5 }, { row: 3, col: 5 });
    expect(result).toEqual([{ row: 3, col: 5 }]);
  });

  it("should resolve horizontal path", () => {
    const result = resolvePath({ row: 0, col: 0 }, { row: 0, col: 4 });
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);
  });

  it("should resolve vertical path", () => {
    const result = resolvePath({ row: 1, col: 2 }, { row: 4, col: 2 });
    expect(result).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
    ]);
  });

  it("should resolve diagonal path", () => {
    const result = resolvePath({ row: 0, col: 0 }, { row: 3, col: 3 });
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ]);
  });

  it("should resolve negative direction path", () => {
    const result = resolvePath({ row: 3, col: 3 }, { row: 0, col: 0 });
    expect(result).toEqual([
      { row: 3, col: 3 },
      { row: 2, col: 2 },
      { row: 1, col: 1 },
      { row: 0, col: 0 },
    ]);
  });

  it("should resolve mixed diagonal path (more rows than cols)", () => {
    const result = resolvePath({ row: 0, col: 0 }, { row: 4, col: 2 });
    // Should have 5 positions (longer axis = 4 steps)
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ row: 0, col: 0 });
    expect(result[result.length - 1]).toEqual({ row: 4, col: 2 });
    // Each step should move at most 1 in each direction
    for (let i = 1; i < result.length; i++) {
      const dr = Math.abs(result[i].row - result[i - 1].row);
      const dc = Math.abs(result[i].col - result[i - 1].col);
      expect(dr).toBeLessThanOrEqual(1);
      expect(dc).toBeLessThanOrEqual(1);
      expect(dr + dc).toBeGreaterThanOrEqual(1);
    }
  });

  it("should resolve mixed diagonal path (more cols than rows)", () => {
    const result = resolvePath({ row: 0, col: 0 }, { row: 2, col: 5 });
    // Should have 6 positions (longer axis = 5 steps)
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ row: 0, col: 0 });
    expect(result[result.length - 1]).toEqual({ row: 2, col: 5 });
    for (let i = 1; i < result.length; i++) {
      const dr = Math.abs(result[i].row - result[i - 1].row);
      const dc = Math.abs(result[i].col - result[i - 1].col);
      expect(dr).toBeLessThanOrEqual(1);
      expect(dc).toBeLessThanOrEqual(1);
      expect(dr + dc).toBeGreaterThanOrEqual(1);
    }
  });

  it("should resolve single step path", () => {
    const result = resolvePath({ row: 5, col: 5 }, { row: 5, col: 6 });
    expect(result).toEqual([
      { row: 5, col: 5 },
      { row: 5, col: 6 },
    ]);
  });
});

describe("resolveMultiSegmentPath", () => {
  it("should return empty array for empty waypoints", () => {
    expect(resolveMultiSegmentPath([])).toEqual([]);
  });

  it("should return single waypoint as-is", () => {
    expect(resolveMultiSegmentPath([{ row: 1, col: 1 }])).toEqual([
      { row: 1, col: 1 },
    ]);
  });

  it("should resolve two-point path (same as resolvePath)", () => {
    const result = resolveMultiSegmentPath([
      { row: 0, col: 0 },
      { row: 0, col: 3 },
    ]);
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]);
  });

  it("should resolve multi-segment path without duplicate shared endpoints", () => {
    const result = resolveMultiSegmentPath([
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 2 },
    ]);
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
  });

  it("should handle L-shaped path through three waypoints", () => {
    const result = resolveMultiSegmentPath([
      { row: 0, col: 0 },
      { row: 3, col: 0 },
      { row: 3, col: 3 },
    ]);
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ]);
  });

  it("should handle same-cell waypoints gracefully", () => {
    const result = resolveMultiSegmentPath([
      { row: 1, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 3 },
    ]);
    // First segment is same cell, second is horizontal
    expect(result[0]).toEqual({ row: 1, col: 1 });
    expect(result[result.length - 1]).toEqual({ row: 1, col: 3 });
    // No duplicate at the shared endpoint
    const serialized = result.map((p) => `${p.row},${p.col}`);
    const unique = [...new Set(serialized)];
    expect(serialized.length).toBe(unique.length);
  });
});
