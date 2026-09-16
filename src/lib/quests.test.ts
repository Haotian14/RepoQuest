import { describe, expect, it, vi } from 'vitest'
import { loadReviewedCommits, questStorageKey, saveReviewedCommits } from './quests'

describe('commit quest progress', () => {
  it('keeps progress separate for every repository', () => {
    expect(questStorageKey('OpenAI/Codex')).toBe('repoquest:reviewed-commits:openai/codex')
  })

  it('loads valid saved commit SHAs and ignores broken storage', () => {
    expect([...loadReviewedCommits('owner/repo', { getItem: () => '["abc","def"]' })]).toEqual(['abc', 'def'])
    expect([...loadReviewedCommits('owner/repo', { getItem: () => 'broken' })]).toEqual([])
  })

  it('saves reviewed commits as JSON', () => {
    const setItem = vi.fn()
    saveReviewedCommits('owner/repo', new Set(['abc']), { setItem })
    expect(setItem).toHaveBeenCalledWith('repoquest:reviewed-commits:owner/repo', '["abc"]')
  })
})
