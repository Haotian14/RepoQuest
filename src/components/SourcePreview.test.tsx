import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoRepository } from '../demo'
import { SourcePreview } from './SourcePreview'

afterEach(() => vi.unstubAllGlobals())

describe('SourcePreview', () => {
  it('loads highlighted source, marks changed lines, and navigates the reading route', async () => {
    const files = [
      { path: 'src/App.tsx', size: 80, type: 'blob' as const },
      { path: 'src/lib/map.ts', size: 90, type: 'blob' as const },
    ]
    const repository = {
      ...demoRepository,
      recentFileChanges: {
        'src/App.tsx': { path: 'src/App.tsx', status: 'modified', additions: 1, deletions: 0, changedLines: [2] },
      },
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => 'import React from \'react\'\nconst answer = 42' })
      .mockResolvedValueOnce({ ok: true, text: async () => 'export const map = true' })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(
      <SourcePreview repository={repository} files={files} initialPath="src/App.tsx" onClose={() => undefined} />,
    )

    expect(screen.getByRole('dialog', { name: 'App.tsx' })).toBeTruthy()
    expect(await screen.findByLabelText('Source code for src/App.tsx')).toBeTruthy()
    expect(container.querySelector('.source-line.changed-line .source-line-number')?.textContent).toBe('2')
    expect(screen.getByText('MODIFIED')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Preview next recommended file' }))
    expect(await screen.findByLabelText('Source code for src/lib/map.ts')).toBeTruthy()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('offers GitHub as a fallback when a binary file cannot be previewed', () => {
    render(
      <SourcePreview
        repository={demoRepository}
        files={[{ path: 'public/hero.png', size: 100, type: 'blob' }]}
        initialPath="public/hero.png"
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('PREVIEW BLOCKED')).toBeTruthy()
    const links = screen.getAllByRole('link', { name: /open.*github/i })
    expect(links[0].getAttribute('href')).toBe('https://github.com/Haotian14/RepoQuest/blob/main/public/hero.png')
  })
})
