import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { buildDistricts } from '../lib/map'
import { Inspector } from './Inspector'

const districts = buildDistricts(demoRepository)

describe('Inspector smart guide', () => {
  it('reveals a transparent local reading guide on demand', () => {
    const source = districts.find((district) => district.path === 'src')!
    render(<Inspector district={source} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))

    expect(screen.getByText('LOCAL ANALYSIS · NO API KEY')).toBeTruthy()
    expect(screen.getByText('CORE WORKSHOP')).toBeTruthy()
    expect(screen.getByText('src/App.tsx')).toBeTruthy()
    expect(screen.getByRole('button', { name: /close smart guide/i }).getAttribute('aria-expanded')).toBe('true')
  })

  it('closes the guide when the explorer changes districts', () => {
    const source = districts.find((district) => district.path === 'src')!
    const root = districts.find((district) => district.path === 'root')!
    const { rerender } = render(<Inspector district={source} />)

    fireEvent.click(screen.getByRole('button', { name: /open smart guide/i }))
    rerender(<Inspector district={root} />)

    expect(screen.queryByText('CORE WORKSHOP')).toBeNull()
    expect(screen.getByRole('button', { name: /open smart guide/i }).getAttribute('aria-expanded')).toBe('false')
  })
})
