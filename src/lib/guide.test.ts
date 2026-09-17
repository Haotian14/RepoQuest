import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from './map'
import { buildDistrictGuide } from './guide'

const districts = buildDistricts(demoRepository)

describe('buildDistrictGuide', () => {
  it('recognizes the source district and produces a short reading route', () => {
    const source = districts.find((district) => district.path === 'src')!
    const guide = buildDistrictGuide(source)

    expect(guide.role).toBe('CORE WORKSHOP')
    expect(guide.keyFiles).toHaveLength(4)
    expect(guide.keyFiles.some((file) => file.path === 'src/App.tsx')).toBe(true)
    expect(guide.notes.length).toBeGreaterThanOrEqual(3)
  })

  it('prioritizes orientation files in the repository root', () => {
    const root = districts.find((district) => district.path === 'root')!
    const guide = buildDistrictGuide(root)

    expect(guide.role).toBe('PROJECT COMPASS')
    expect(guide.keyFiles[0].path).toBe('README.md')
    expect(guide.keyFiles[1].path).toBe('package.json')
  })

  it('returns deterministic results', () => {
    const district = districts[0]
    expect(buildDistrictGuide(district)).toEqual(buildDistrictGuide(district))
  })

  it('recognizes nested district roles from the final folder segment', () => {
    const components = buildDistricts(demoRepository, 'src').find((district) => district.path === 'src/components')!
    expect(buildDistrictGuide(components).role).toBe('INTERFACE QUARTER')
  })
})
