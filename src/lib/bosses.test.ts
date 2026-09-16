import { describe, expect, it, vi } from 'vitest'
import { bossStorageKey, bossThreat, loadDefeatedBosses, saveDefeatedBosses } from './bosses'

describe('boss encounters', () => {
  it('turns discussion activity into a capped threat level', () => {
    expect(bossThreat({ comments: 0, labels: [], kind: 'issue' })).toEqual({ health: 18, level: 1, title: 'WANDERING' })
    expect(bossThreat({ comments: 50, labels: ['a', 'b', 'c', 'd', 'e'], kind: 'pull_request' })).toEqual({ health: 100, level: 5, title: 'LEGENDARY' })
  })

  it('stores victories separately per repository', () => {
    expect(bossStorageKey('OpenAI/Codex')).toBe('repoquest:defeated-bosses:openai/codex')
    expect([...loadDefeatedBosses('owner/repo', { getItem: () => '["issue-1"]' })]).toEqual(['issue-1'])
    const setItem = vi.fn()
    saveDefeatedBosses('owner/repo', new Set(['issue-1']), { setItem })
    expect(setItem).toHaveBeenCalledWith('repoquest:defeated-bosses:owner/repo', '["issue-1"]')
  })
})
