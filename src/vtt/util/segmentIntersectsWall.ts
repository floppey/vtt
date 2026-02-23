import { Coordinates } from "@/vtt/types/types";
import { Wall } from "@/vtt/types/mapData/MapData";

/**
 * Compute the intersection point of two line segments using the parametric approach.
 * Segment 1: p1 → p2, Segment 2: p3 → p4.
 * Returns the intersection point if the segments cross, or null otherwise.
 */
function segmentIntersection(
  p1: Coordinates,
  p2: Coordinates,
  p3: Coordinates,
  p4: Coordinates
): Coordinates | null {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null; // parallel or coincident

  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  const u = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / denom;

  // Both parameters must be in (0, 1) exclusive — endpoint touching doesn't count
  const eps = 1e-10;
  if (t <= eps || t >= 1 - eps || u <= eps || u >= 1 - eps) return null;

  return {
    x: p1.x + t * dx1,
    y: p1.y + t * dy1,
  };
}

/**
 * Find all intersection points between a movement segment and movement-blocking walls.
 * Returns an array of intersection coordinates (empty if no crossings).
 */
export const segmentIntersectsWalls = (
  start: Coordinates,
  end: Coordinates,
  walls: Wall[]
): Coordinates[] => {
  const intersections: Coordinates[] = [];
  for (const wall of walls) {
    if (!wall.blocksMovement) continue;
    const hit = segmentIntersection(start, end, wall.start, wall.end);
    if (hit) {
      intersections.push(hit);
    }
  }
  return intersections;
};
