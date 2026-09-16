import { describe, expect, it } from 'vitest'
import { depthForY, isOccludedByBuilding } from './depth'

describe('depthForY', () => {
  it('places lower objects in front of higher objects', () => {
    expect(depthForY(61)).toBeGreaterThan(depthForY(59))
  })

  it('keeps enough precision for small movement steps', () => {
    expect(depthForY(59.4)).toBeGreaterThan(depthForY(59.2))
  })

  it('detects a player hidden directly behind a building', () => {
    expect(isOccludedByBuilding({ x: 50, y: 42 }, { x: 50, y: 59 })).toBe(true)
  })

  it('does not fade a building when the player is beside or in front of it', () => {
    expect(isOccludedByBuilding({ x: 62, y: 42 }, { x: 50, y: 59 })).toBe(false)
    expect(isOccludedByBuilding({ x: 50, y: 62 }, { x: 50, y: 59 })).toBe(false)
  })

  it('does not fade a building for a distant player', () => {
    expect(isOccludedByBuilding({ x: 50, y: 20 }, { x: 50, y: 59 })).toBe(false)
  })
})
