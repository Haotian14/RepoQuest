const WORLD_DEPTH_BASE = 1000
const WORLD_DEPTH_PRECISION = 10

/** Sorts world objects by their shared ground-contact Y coordinate. */
export function depthForY(y: number) {
  return WORLD_DEPTH_BASE + Math.round(y * WORLD_DEPTH_PRECISION)
}
