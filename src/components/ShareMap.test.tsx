import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import { demoRepository } from '../demo'
import { buildDistricts } from '../lib/map'
import { ShareMap } from './ShareMap'

vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

describe('ShareMap', () => {
  beforeEach(() => {
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,map')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  it('exports the complete fixed-size card and reports success', async () => {
    render(<ShareMap repository={demoRepository} districts={buildDistricts(demoRepository)} />)
    fireEvent.click(screen.getByRole('button', { name: /download map/i }))

    await waitFor(() => expect(toPng).toHaveBeenCalled())
    expect(vi.mocked(toPng).mock.calls[0][1]).toMatchObject({
      width: 1200,
      height: 800,
      canvasWidth: 2400,
      canvasHeight: 1600,
    })
    expect(await screen.findByText('Your map card is ready.')).toBeTruthy()
  })
})
