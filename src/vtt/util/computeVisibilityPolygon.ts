import { Coordinates } from "@/vtt/types/types";
import { Wall } from "@/vtt/types/mapData/MapData";

interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/**
 * Compute the visibility polygon from a given origin point, occluded by wall segments.
 * Uses a 2D raycasting approach: casts rays toward every wall endpoint (plus small
 * angular offsets to peek around corners), finds the nearest wall intersection per ray,
 * and returns the resulting polygon vertices sorted by angle.
 *
 * @param origin - The viewpoint position in pixel coordinates
 * @param walls - Wall segments that block vision (only those with blocksVision=true should be passed)
 * @param maxRadius - Maximum vision range in pixels (rays are clipped to this distance)
 * @returns Array of Coordinates forming the visibility polygon, sorted by angle
 */
export function computeVisibilityPolygon(
  origin: Coordinates,
  walls: Wall[],
  maxRadius: number
): Coordinates[] {
  const segments: Segment[] = walls.map((w) => ({
    ax: w.start.x,
    ay: w.start.y,
    bx: w.end.x,
    by: w.end.y,
  }));

  // Collect unique angles to all wall endpoints from origin
  const angles: number[] = [];
  const EPSILON = 0.00001;

  for (const seg of segments) {
    const a1 = Math.atan2(seg.ay - origin.y, seg.ax - origin.x);
    const a2 = Math.atan2(seg.by - origin.y, seg.bx - origin.x);
    // Cast 3 rays per endpoint: direct + tiny offsets to see around corners
    angles.push(a1 - EPSILON, a1, a1 + EPSILON);
    angles.push(a2 - EPSILON, a2, a2 + EPSILON);
  }

  // Also add rays to bounding circle edges (ensures full coverage)
  const NUM_BOUNDARY_RAYS = 64;
  for (let i = 0; i < NUM_BOUNDARY_RAYS; i++) {
    angles.push(((2 * Math.PI) / NUM_BOUNDARY_RAYS) * i - Math.PI);
  }

  // For each angle, find the nearest intersection with any segment
  const points: { angle: number; x: number; y: number }[] = [];

  for (const angle of angles) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    // Ray: origin + t * (dx, dy), t >= 0
    let closestT = maxRadius;

    for (const seg of segments) {
      const t = raySegmentIntersection(
        origin.x,
        origin.y,
        dx,
        dy,
        seg.ax,
        seg.ay,
        seg.bx,
        seg.by
      );
      if (t !== null && t < closestT) {
        closestT = t;
      }
    }

    points.push({
      angle,
      x: origin.x + dx * closestT,
      y: origin.y + dy * closestT,
    });
  }

  // Sort by angle
  points.sort((a, b) => a.angle - b.angle);

  // Deduplicate very close points
  const result: Coordinates[] = [];
  for (const p of points) {
    if (result.length === 0) {
      result.push({ x: p.x, y: p.y });
      continue;
    }
    const prev = result[result.length - 1];
    const distSq = (p.x - prev.x) ** 2 + (p.y - prev.y) ** 2;
    if (distSq > 0.1) {
      result.push({ x: p.x, y: p.y });
    }
  }

  return result;
}

/**
 * Compute ray-segment intersection.
 * Ray: (ox, oy) + t * (dx, dy), t >= 0
 * Segment: (ax, ay) to (bx, by), parameter s in [0, 1]
 * Returns t if intersection exists, null otherwise.
 */
function raySegmentIntersection(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number | null {
  const ex = bx - ax;
  const ey = by - ay;

  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-10) return null; // Parallel

  const fx = ax - ox;
  const fy = ay - oy;

  const t = (fx * ey - fy * ex) / denom;
  const s = (fx * dy - fy * dx) / denom;

  if (t < 0) return null; // Behind ray origin
  if (s < 0 || s > 1) return null; // Outside segment

  return t;
}
