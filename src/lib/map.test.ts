import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts, formatBytes } from './map'

describe('buildDistricts', () => {
  it('groups files into top-level map districts', () => {
    const districts = buildDistricts(demoRepository)
    expect(districts.find((district) => district.path === 'src')?.fileCount).toBe(7)
    expect(districts.some((district) => district.path === 'root')).toBe(true)
  })

  it('limits the world to available map slots', () => {
    expect(buildDistricts(demoRepository).length).toBeLessThanOrEqual(9)
  })
})

describe('formatBytes', () => {
  it('formats byte sizes for the inspector', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
