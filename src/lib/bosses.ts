import type { BossEncounter } from '../types'

const STORAGE_PREFIX = 'repoquest:defeated-bosses:'

export function bossThreat(boss: Pick<BossEncounter, 'comments' | 'labels' | 'kind'>) {
  const health = Math.min(100, 18 + Math.min(boss.comments, 12) * 5 + Math.min(boss.labels.length, 4) * 7 + (boss.kind === 'pull_request' ? 10 : 0))
  const level = Math.max(1, Math.ceil(health / 20))
  const title = level >= 5 ? 'LEGENDARY' : level >= 4 ? 'FIERCE' : level >= 3 ? 'HARDENED' : level >= 2 ? 'RESTLESS' : 'WANDERING'
  return { health, level, title }
}

export function bossStorageKey(repositoryKey: string) {
  return `${STORAGE_PREFIX}${repositoryKey.toLowerCase()}`
}

export function loadDefeatedBosses(repositoryKey: string, storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(bossStorageKey(repositoryKey)) || '[]')
    return new Set<string>(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

export function saveDefeatedBosses(repositoryKey: string, defeated: Set<string>, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(bossStorageKey(repositoryKey), JSON.stringify([...defeated]))
  } catch {
    // Battle progress is optional and must never block repository exploration.
  }
}
