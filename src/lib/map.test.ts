import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts, formatBytes, repositoryTheme } from './map'

describe('buildDistricts', () => {
  it('groups files into top-level map districts', () => {
    const districts = buildDistricts(demoRepository)
    expect(districts.find((district) => district.path === 'src')?.fileCount).toBe(7)
    expect(districts.some((district) => district.path === 'root')).toBe(true)
  })

  it('limits the world to available map slots', () => {
    expect(buildDistricts(demoRepository).length).toBeLessThanOrEqual(9)
  })

  it('builds the next folder level with full paths and a local-files landmark', () => {
    const districts = buildDistricts(demoRepository, 'src')
    expect(districts.find((district) => district.path === 'src/components')).toMatchObject({
      label: 'components',
      kind: 'directory',
      fileCount: 3,
    })
    expect(districts.find((district) => district.path === 'src')).toMatchObject({
      label: 'Local Files',
      kind: 'files',
      fileCount: 2,
    })
  })

  it('selects a distinct biome from the repository language', () => {
    expect(repositoryTheme('TypeScript')).toBe('arcane')
    expect(repositoryTheme('Python')).toBe('forest')
    expect(repositoryTheme('Rust')).toBe('forge')
  })
})

describe('formatBytes', () => {
  it('formats byte sizes for the inspector', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
