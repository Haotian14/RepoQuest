import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from '../lib/map'
import { WorldMap } from './WorldMap'

const districts = buildDistricts(demoRepository)

function mockViewport(mobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: mobile && query === '(max-width: 850px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('WorldMap', () => {
  beforeEach(() => mockViewport(false))

  it('maps recently changed files to their district and exposes the count', () => {
    render(
      <WorldMap
        districts={districts}
        recentChangedPaths={['src/App.tsx', 'src/lib/map.ts', 'README.md']}
        onSelect={vi.fn()}
      />,
    )

    const source = screen.getByRole('button', { name: /Explore src, 7 files, 2 recent changes/i })
    const root = screen.getByRole('button', { name: /Explore Town Hall, 3 files, 1 recent change/i })
    expect(source.classList.contains('recent-change')).toBe(true)
    expect(root.classList.contains('recent-change')).toBe(true)
    expect(source.querySelector('.building-change-badge')?.textContent).toBe('CHANGED ×2')
  })

  it('keeps building focus so WASD movement continues after selection', () => {
    const onSelect = vi.fn()
    render(<WorldMap districts={districts} onSelect={onSelect} />)

    const building = screen.getByRole('button', { name: /Explore src/i })
    building.focus()
    fireEvent.click(building)
    expect(document.activeElement).toBe(building)
    expect(onSelect).toHaveBeenCalled()

    fireEvent.keyDown(building, { key: 'd' })
    expect(screen.getByLabelText('Explorer character').style.left).toBe('51.4%')
  })

  it('resets the explorer when a new district collection is loaded', () => {
    const { rerender } = render(<WorldMap districts={districts} onSelect={vi.fn()} />)
    const map = screen.getByLabelText(/Repository world map/i)
    fireEvent.keyDown(map, { key: 'd' })
    expect(screen.getByLabelText('Explorer character').style.left).toBe('51.4%')

    rerender(<WorldMap districts={[...districts]} onSelect={vi.fn()} />)
    expect(screen.getByLabelText('Explorer character').style.left).toBe('49%')
  })

  it('keeps the explorer centered in the mobile viewport while moving', async () => {
    mockViewport(true)
    const scrollTo = vi.fn()
    render(<WorldMap districts={districts} onSelect={vi.fn()} />)

    const viewport = document.querySelector<HTMLElement>('.world-viewport')!
    const map = screen.getByLabelText(/Repository world map/i)
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 320 })
    Object.defineProperty(map, 'scrollWidth', { configurable: true, value: 960 })
    Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo })

    fireEvent.click(screen.getByRole('button', { name: 'Move right' }))

    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({ left: 333.44, behavior: 'auto' }))
  })
})
