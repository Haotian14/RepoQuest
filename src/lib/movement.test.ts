import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from './map'
import { movePlayer, nearestDistrict } from './movement'

describe('movePlayer', () => {
  it('moves in the requested direction', () => {
    expect(movePlayer({ x: 50, y: 50 }, 'left')).toEqual({ x: 47.6, y: 50 })
  })

  it('keeps the player inside the map', () => {
    expect(movePlayer({ x: 5, y: 7 }, 'up')).toEqual({ x: 5, y: 7 })
    expect(movePlayer({ x: 94, y: 91 }, 'right')).toEqual({ x: 94, y: 91 })
  })
})

describe('nearestDistrict', () => {
  it('finds a district within interaction range', () => {
    const districts = buildDistricts(demoRepository)
    const target = districts[0]
    expect(nearestDistrict({ x: target.x + 2, y: target.y + 2 }, districts)?.id).toBe(target.id)
  })

  it('returns nothing when every building is too far away', () => {
    expect(nearestDistrict({ x: 99, y: 1 }, buildDistricts(demoRepository), 1)).toBeUndefined()
  })
})
