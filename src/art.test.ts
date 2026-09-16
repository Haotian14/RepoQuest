import { describe, expect, it } from 'vitest'
import { buildingArchetype, explorerDirectionRow } from './art'

describe('buildingArchetype', () => {
  it('maps important repository folders to distinct district types', () => {
    expect(buildingArchetype('root', 'Town Hall').className).toBe('town-hall')
    expect(buildingArchetype('src', 'src').className).toBe('workshop')
    expect(buildingArchetype('docs', 'docs').className).toBe('library')
    expect(buildingArchetype('tests', 'tests').className).toBe('guild')
    expect(buildingArchetype('public', 'public').className).toBe('storehouse')
  })

  it('always provides a visible marker and main sprite', () => {
    const artwork = buildingArchetype('features', 'features')
    expect(artwork.marker).toBeTruthy()
    expect(artwork.main).toMatch(/\.png$/)
  })

  it('maps LPC sprite rows to their real facing directions', () => {
    expect(explorerDirectionRow).toEqual({ up: 0, right: 1, down: 2, left: 3 })
  })
})
