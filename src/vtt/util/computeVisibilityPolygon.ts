import { Coordinates } from "@/vtt/types/types";
import { Wall } from "@/vtt/types/mapData/MapData";

interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/**
 * A circle representing a light source for ray extension.
 * All values in pixel coordinates.
 */
export interface LightCircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Compute the visibility polygon from a given origin point, occluded by wall segments.
 * Uses a 2D raycasting approach: casts rays toward every wall endpoint (plus small
 * angular offsets to peek around corners), finds the nearest wall intersection per ray,
 * and returns the resulting polygon vertices sorted by angle.
 *
 * When `lightCircles` is provided, rays that reach `maxRadius` (e.g. darkvision range)
 * without hitting a wall will extend further as long as they remain continuously inside
 * at least one light circle. The ray stops at the first wall hit or when it exits all
 * lit areas. `hardMaxRadius` sets the absolute upper bound for ray length (typically the
 * map diagonal).
 *
 * @param origin - The viewpoint position in pixel coordinates
 * @param walls - Wall segments that block vision (only those with blocksVision=true should be passed)
 * @param maxRadius - Maximum vision range in pixels (rays are clipped to this distance)
 * @param lightCircles - Optional array of light circles; when provided, rays extend through lit areas
 * @param hardMaxRadius - Absolute max ray length when using lightCircles (e.g. map diagonal)
 * @returns Array of Coordinates forming the visibility polygon, sorted by angle
 */
export function computeVisibilityPolygon(
  origin: Coordinates,
  walls: Wall[],
  maxRadius: number,
  lightCircles?: LightCircle[],
  hardMaxRadius?: number
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

  const hasLights =
    lightCircles !== undefined && lightCircles.length > 0;
  // When extending through lit areas, rays can reach the map diagonal
  const rayLimit = hasLights && hardMaxRadius !== undefined
    ? hardMaxRadius
    : maxRadius;

  // For each angle, find the nearest intersection with any segment
  const points: { angle: number; x: number; y: number }[] = [];

  for (const angle of angles) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    // Ray: origin + t * (dx, dy), t >= 0
    // Find nearest wall hit (up to rayLimit, not just maxRadius)
    let wallT = rayLimit;

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
      if (t !== null && t < wallT) {
        wallT = t;
      }
    }

    let effectiveT: number;

    if (!hasLights) {
      // No light extension — clamp to maxRadius or wall, whichever is closer
      effectiveT = Math.min(wallT, maxRadius);
    } else if (wallT <= maxRadius) {
      // Hit a wall before reaching darkvision limit — wall wins
      effectiveT = wallT;
    } else {
      // Ray goes past darkvision limit before hitting a wall.
      // Check if the ray is in a lit area at maxRadius and extend through it.
      effectiveT = computeLitExtension(
        origin,
        dx,
        dy,
        maxRadius,
        wallT,
        lightCircles!
      );
    }

    points.push({
      angle,
      x: origin.x + dx * effectiveT,
      y: origin.y + dy * effectiveT,
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
 * Compute how far a vision ray extends through continuously lit areas.
 *
 * For each light circle, computes the interval [t_enter, t_exit] where the ray
 * P(t) = origin + t * dir is inside the circle. Merges overlapping intervals
 * from t=0 outward to find continuous lit coverage from the unit's position.
 * The effective ray distance is max(visionRadius, end of continuous lit chain).
 *
 * @param origin - Ray origin (unit position)
 * @param dx - Ray direction x (unit vector)
 * @param dy - Ray direction y (unit vector)
 * @param visionRadius - Darkvision range in pixels
 * @param wallT - Distance to nearest wall hit along this ray
 * @param lightCircles - Light source circles to check against
 * @returns The effective ray distance (at least visionRadius, up to wallT)
 */
function computeLitExtension(
  origin: Coordinates,
  dx: number,
  dy: number,
  visionRadius: number,
  wallT: number,
  lightCircles: LightCircle[]
): number {
  // Collect ray-circle intervals from t=0 to wallT
  const intervals: [number, number][] = [];
  // The darkvision zone acts as a virtual lit interval [0, visionRadius].
  // This ensures any light circle overlapping with the darkvision edge extends the ray.
  intervals.push([0, visionRadius]);
  for (const light of lightCircles) {
    const interval = rayCircleInterval(origin, dx, dy, light);
    if (interval === null) continue;
    const [tEnter, tExit] = interval;
    // Only care about intervals that overlap with [0, wallT]
    if (tExit <= 0 || tEnter >= wallT) continue;
    intervals.push([
      Math.max(tEnter, 0),
      Math.min(tExit, wallT),
    ]);
  }
  // Sort intervals by start
  intervals.sort((a, b) => a[0] - b[0]);
  // Merge overlapping/adjacent intervals to find continuous coverage from origin
  let furthest = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] <= furthest + 0.001) {
      // Overlapping or adjacent — extend
      furthest = Math.max(furthest, intervals[i][1]);
    } else {
      // Gap in lighting — stop here
      break;
    }
  }
  // The ray sees at least visionRadius; if lit coverage goes further, extend
  return Math.max(visionRadius, furthest);
}

/**
 * Compute the interval [t_enter, t_exit] where a ray intersects a circle.
 *
 * Ray: P(t) = origin + t * (dx, dy)
 * Circle: center (cx, cy), radius r
 *
 * Solves: |P(t) - C|² = r²
 * => t² - 2t*(d·(C-O)) + |O-C|² - r² = 0
 *
 * @returns [t_enter, t_exit] if the ray intersects the circle, null otherwise
 */
function rayCircleInterval(
  origin: Coordinates,
  dx: number,
  dy: number,
  circle: LightCircle
): [number, number] | null {
  // Vector from origin to circle center
  const ocx = circle.x - origin.x;
  const ocy = circle.y - origin.y;

  // Quadratic coefficients: at² + bt + c = 0
  // a = dx² + dy² = 1 (unit direction vector)
  const a = dx * dx + dy * dy;
  const b = -2 * (dx * ocx + dy * ocy);
  const c = ocx * ocx + ocy * ocy - circle.radius * circle.radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null; // Ray misses circle entirely

  const sqrtDisc = Math.sqrt(discriminant);
  const tEnter = (-b - sqrtDisc) / (2 * a);
  const tExit = (-b + sqrtDisc) / (2 * a);

  // Both intersections behind origin — circle is behind us
  if (tExit < 0) return null;

  // Clamp t_enter to 0 (origin is inside the circle)
  return [Math.max(tEnter, 0), tExit];
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
