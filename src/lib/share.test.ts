import { describe, expect, it } from 'vitest'
import { shareFilename } from './share'

describe('shareFilename', () => {
  it('creates a safe predictable PNG name', () => {
    expect(shareFilename('Open AI', 'Repo/Quest')).toBe('repoquest-open-ai-repo-quest.png')
  })

  it('falls back when the repository name has no safe characters', () => {
    expect(shareFilename('✨', '✨')).toBe('repoquest-repository.png')
  })
})
