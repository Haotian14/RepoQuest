import { describe, expect, it } from 'vitest'
import { normalizeCommits, parseRepository } from './github'

describe('parseRepository', () => {
  it('parses shorthand repository names', () => {
    expect(parseRepository('Haotian14/RepoQuest')).toEqual({ owner: 'Haotian14', name: 'RepoQuest' })
  })

  it('parses GitHub URLs and strips .git', () => {
    expect(parseRepository('https://github.com/Haotian14/RepoQuest.git')).toEqual({
      owner: 'Haotian14',
      name: 'RepoQuest',
    })
  })

  it('rejects invalid values', () => {
    expect(() => parseRepository('not-a-repository')).toThrow('Use a GitHub URL')
  })
})

describe('normalizeCommits', () => {
  it('turns GitHub history into concise quests', () => {
    expect(normalizeCommits([{
      sha: 'abc123',
      html_url: 'https://github.com/example/repo/commit/abc123',
      author: { login: 'octocat', avatar_url: 'avatar.png' },
      commit: { message: 'feat: add map\n\nLong details', author: { name: 'Mona', date: '2026-09-16T00:00:00Z' } },
    }])).toEqual([{
      sha: 'abc123',
      message: 'feat: add map',
      author: 'octocat',
      avatarUrl: 'avatar.png',
      date: '2026-09-16T00:00:00Z',
      url: 'https://github.com/example/repo/commit/abc123',
    }])
  })
})
