import { describe, expect, it } from 'vitest'
import { clearRecentRepositories, loadRecentRepositories, recentRepositoryLabel, rememberRepository } from './recent'

function memoryStorage(initialValue: string | null = null) {
  let value = initialValue
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next },
    removeItem: () => { value = null },
  }
}

describe('recent repositories', () => {
  it('puts the newest repository first and deduplicates names case-insensitively', () => {
    const storage = memoryStorage()
    rememberRepository({ owner: 'OpenAI', name: 'Codex' }, storage, 10)
    const recent = rememberRepository({ owner: 'openai', name: 'codex' }, storage, 20)

    expect(recent).toEqual([{ owner: 'openai', name: 'codex', viewedAt: 20 }])
  })

  it('keeps only the five most recent valid entries', () => {
    const storage = memoryStorage()
    for (let index = 0; index < 7; index += 1) {
      rememberRepository({ owner: 'explorer', name: `repo-${index}` }, storage, index)
    }

    const recent = loadRecentRepositories(storage)
    expect(recent).toHaveLength(5)
    expect(recent.map(recentRepositoryLabel)).toEqual([
      'explorer/repo-6',
      'explorer/repo-5',
      'explorer/repo-4',
      'explorer/repo-3',
      'explorer/repo-2',
    ])
  })

  it('recovers safely from malformed storage', () => {
    expect(loadRecentRepositories(memoryStorage('{not json'))).toEqual([])
  })

  it('clears recent repository history', () => {
    const storage = memoryStorage('[{"owner":"openai","name":"codex","viewedAt":1}]')
    clearRecentRepositories(storage)
    expect(loadRecentRepositories(storage)).toEqual([])
  })
})
