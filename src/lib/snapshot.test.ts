import { beforeEach, describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { compareRepositorySnapshot, loadRepositorySnapshot, saveExplorationLocation, saveRepositorySnapshot } from './snapshot'

describe('repository snapshots', () => {
  beforeEach(() => localStorage.clear())

  it('tracks added, removed, modified, and newly active repository items', () => {
    const previous = {
      version: 1,
      visitedAt: '2026-09-01T00:00:00.000Z',
      files: [['src/App.tsx', 1], ['old.ts', 10]] as Array<[string, number]>,
      commitShas: ['old-commit'],
      bossIds: ['issue-9'],
      exploration: { mapPath: 'src', selectedPath: 'src/components', selectedKind: 'directory' as const },
    }

    const report = compareRepositorySnapshot(demoRepository, previous)

    expect(report.modifiedFiles).toContain('src/App.tsx')
    expect(report.removedFiles).toEqual(['old.ts'])
    expect(report.addedFiles).toContain('README.md')
    expect(report.changedAreas[0].count).toBeGreaterThan(0)
    expect(report.newCommits).toHaveLength(demoRepository.commits.length)
    expect(report.newPullRequests.some((boss) => boss.id === 'pull_request-11')).toBe(true)
    expect(report.previousExploration?.mapPath).toBe('src')
  })

  it('persists the latest snapshot while preserving and updating exploration location', () => {
    saveRepositorySnapshot(demoRepository, { mapPath: 'src' })
    expect(loadRepositorySnapshot(demoRepository)?.exploration.mapPath).toBe('src')

    saveExplorationLocation(demoRepository, { mapPath: 'src/components', selectedPath: 'src/components', selectedKind: 'files' })
    expect(loadRepositorySnapshot(demoRepository)?.exploration).toEqual({
      mapPath: 'src/components', selectedPath: 'src/components', selectedKind: 'files',
    })
  })
})
