import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from '../lib/map'
import { Inspector } from './Inspector'

const districts = buildDistricts(demoRepository)

afterEach(() => vi.unstubAllGlobals())

describe('Inspector smart guide', () => {
  it('reveals a transparent local reading guide on demand', () => {
    const source = districts.find((district) => district.path === 'src')!
    render(<Inspector district={source} repository={demoRepository} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))

    expect(screen.getByText(/READING KEY FILES LOCALLY|LOCAL ANALYSIS · NO API KEY/)).toBeTruthy()
    expect(screen.getByText('CORE WORKSHOP')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Preview suggested file src/App.tsx' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /close smart guide/i }).getAttribute('aria-expanded')).toBe('true')
  })

  it('previews nearby files in-site and keeps the exact GitHub source link', async () => {
    const source = districts.find((district) => district.path === 'src')!
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'export const map = true' }))
    render(<Inspector district={source} repository={{ ...demoRepository, defaultBranch: 'feature/map polish' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Preview nearby file src/App.tsx' }))
    const dialog = await screen.findByRole('dialog', { name: 'App.tsx' })
    const link = dialog.querySelector<HTMLAnchorElement>('a[href*="github.com"]')!
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

    const links = screen.getAllByRole('button', { name: /Preview nearby file/i })
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

  it('shows stack, startup, imports, and test signals from local static analysis', async () => {
    const source = districts.find((district) => district.path === 'src')!
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      text: async () => url.includes('package.json')
        ? JSON.stringify({ scripts: { dev: 'vite' }, dependencies: { react: '^19' }, devDependencies: { typescript: '^7', vite: '^8' } })
        : "import { WorldMap } from './components/WorldMap'",
    })))
    render(<Inspector district={source} repository={demoRepository} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))

    expect(await screen.findByText(/STATIC ANALYSIS · \d+ FILES/)).toBeTruthy()
    expect(screen.getByText('TypeScript · React · Vite')).toBeTruthy()
    expect(screen.getByText('npm run dev — vite')).toBeTruthy()
    expect(screen.getAllByText(/src\/App.tsx/).length).toBeGreaterThan(0)
    expect(screen.getByText(/\.\/components\/WorldMap/)).toBeTruthy()
    expect(screen.getByText(/tests\/map.test.ts/)).toBeTruthy()
  })
})
