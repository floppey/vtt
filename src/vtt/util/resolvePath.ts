import { GridPosition } from "@/vtt/types/types";

/**
 * Resolve the intermediate grid cells between two grid positions.
 * Uses a step-by-step approach: moves one axis at a time,
 * alternating between row and column movement.
 * The returned array includes the start and end positions.
 */
export function resolvePath(
  from: GridPosition,
  to: GridPosition
): GridPosition[] {
  if (from.row === to.row && from.col === to.col) {
    return [from];
  }

  const path: GridPosition[] = [];
  let { row, col } = from;
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  const stepsRow = Math.abs(dRow);
  const stepsCol = Math.abs(dCol);
  const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
  const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;

  // Bresenham-style line: walk the longer axis one step at a time,
  // stepping the shorter axis when the accumulated error overflows.
  const totalSteps = Math.max(stepsRow, stepsCol);
  let errRow = 0;
  let errCol = 0;

  path.push({ row, col });

  for (let i = 0; i < totalSteps; i++) {
    errRow += stepsRow;
    errCol += stepsCol;

    if (errRow >= totalSteps && errCol >= totalSteps) {
      // Diagonal step: move both axes simultaneously
      row += stepRow;
      col += stepCol;
      errRow -= totalSteps;
      errCol -= totalSteps;
    } else if (errRow >= errCol) {
      row += stepRow;
      errRow -= totalSteps;
    } else {
      col += stepCol;
      errCol -= totalSteps;
    }

    path.push({ row, col });
  }

  // Ensure we end exactly at the target
  const last = path[path.length - 1];
  if (last.row !== to.row || last.col !== to.col) {
    path.push({ row: to.row, col: to.col });
  }

  return path;
}

/**
 * Resolve a multi-segment path through waypoints.
 * Each segment is resolved individually, deduplicating shared endpoints.
 */
export function resolveMultiSegmentPath(
  waypoints: GridPosition[]
): GridPosition[] {
  if (waypoints.length === 0) return [];
  if (waypoints.length === 1) return [waypoints[0]];

  const fullPath: GridPosition[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = resolvePath(waypoints[i], waypoints[i + 1]);
    if (i === 0) {
      fullPath.push(...segment);
    } else {
      // Skip the first position of subsequent segments (shared endpoint)
      fullPath.push(...segment.slice(1));
    }
  }

  return fullPath;
}