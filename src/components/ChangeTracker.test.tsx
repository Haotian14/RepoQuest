import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChangeTracker } from './ChangeTracker'

describe('ChangeTracker', () => {
  it('summarizes deltas and resumes the previous map location', () => {
    const onResume = vi.fn()
    render(<ChangeTracker onResume={onResume} report={{
      hasPreviousVisit: true,
      previousVisit: '2026-09-01T12:00:00.000Z',
      addedFiles: ['src/new.ts'],
      modifiedFiles: ['src/App.tsx'],
      removedFiles: ['docs/old.md'],
      changedAreas: [{ path: 'src', count: 2 }, { path: 'docs', count: 1 }],
      newCommits: [],
      newIssues: [],
      newPullRequests: [],
      previousExploration: { mapPath: 'src' },
    }} />)

    expect(screen.getByLabelText('Changes since your last visit')).toBeTruthy()
    expect(screen.getByText('src').parentElement?.textContent).toContain('2')
    fireEvent.click(screen.getByRole('button', { name: /continue last exploration/i }))
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('explains when first-visit tracking has started', () => {
    render(<ChangeTracker onResume={() => undefined} report={{
      hasPreviousVisit: false,
      addedFiles: [], modifiedFiles: [], removedFiles: [], changedAreas: [],
      newCommits: [], newIssues: [], newPullRequests: [],
    }} />)
    expect(screen.getByText('EXPEDITION SNAPSHOT SAVED')).toBeTruthy()
  })
})
