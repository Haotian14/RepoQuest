const WORLD_DEPTH_BASE = 1000
const WORLD_DEPTH_PRECISION = 10

type GroundPoint = { x: number; y: number }

/** Sorts world objects by their shared ground-contact Y coordinate. */
export function depthForY(y: number) {
  return WORLD_DEPTH_BASE + Math.round(y * WORLD_DEPTH_PRECISION)
}

/** True only while the player is inside the visible body of a building and behind its baseline. */
export function isOccludedByBuilding(
  player: GroundPoint,
  building: GroundPoint,
  horizontalRadius = 10,
  bodyDepth = 32,
) {
  const distanceBehind = building.y - player.y
  return distanceBehind > 0
    && distanceBehind <= bodyDepth
    && Math.abs(player.x - building.x) <= horizontalRadius
}
