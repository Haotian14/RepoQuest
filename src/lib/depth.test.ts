import { describe, expect, it } from 'vitest'
import { depthForY } from './depth'

describe('depthForY', () => {
  it('places lower objects in front of higher objects', () => {
    expect(depthForY(61)).toBeGreaterThan(depthForY(59))
  })

  it('keeps enough precision for small movement steps', () => {
    expect(depthForY(59.4)).toBeGreaterThan(depthForY(59.2))
  })
})
