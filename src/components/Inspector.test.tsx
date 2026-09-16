import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from '../lib/map'
import { Inspector } from './Inspector'

const districts = buildDistricts(demoRepository)

describe('Inspector smart guide', () => {
  it('reveals a transparent local reading guide on demand', () => {
    const source = districts.find((district) => district.path === 'src')!
    render(<Inspector district={source} repository={demoRepository} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))

    expect(screen.getByText('LOCAL ANALYSIS · NO API KEY')).toBeTruthy()
    expect(screen.getByText('CORE WORKSHOP')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open suggested file src/App.tsx on GitHub' }).getAttribute('href')).toBe(
      'https://github.com/Haotian14/RepoQuest/blob/main/src/App.tsx',
    )
    expect(screen.getByRole('button', { name: /close smart guide/i }).getAttribute('aria-expanded')).toBe('true')
  })

  it('links nearby files to their exact source on the default branch', () => {
    const source = districts.find((district) => district.path === 'src')!
    render(<Inspector district={source} repository={{ ...demoRepository, defaultBranch: 'feature/map polish' }} />)

    const link = screen.getByRole('link', { name: 'Open nearby file src/App.tsx on GitHub' })
    expect(link.getAttribute('href')).toBe(
      'https://github.com/Haotian14/RepoQuest/blob/feature/map%20polish/src/App.tsx',
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('puts files changed in the latest commit first', () => {
    const source = districts.find((district) => district.path === 'src')!
    const repository = { ...demoRepository, recentChangedPaths: ['src/lib/github.ts'] }
    render(<Inspector district={source} repository={repository} />)

    const links = screen.getAllByRole('link', { name: /Open nearby file/i })
    expect(links[0].getAttribute('aria-label')).toContain('src/lib/github.ts')
    expect(links[0].textContent).toContain('CHANGED')
  })

  it('closes the guide when the explorer changes districts', () => {
    const source = districts.find((district) => district.path === 'src')!
    const root = districts.find((district) => district.path === 'root')!
    const { rerender } = render(<Inspector district={source} repository={demoRepository} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))
    rerender(<Inspector district={root} repository={demoRepository} />)

    expect(screen.queryByText('CORE WORKSHOP')).toBeNull()
    expect(screen.getByRole('button', { name: /open smart guide/i }).getAttribute('aria-expanded')).toBe('false')
  })
})
