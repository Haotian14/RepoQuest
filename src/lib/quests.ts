const STORAGE_PREFIX = 'repoquest:reviewed-commits:'

export function questStorageKey(repositoryKey: string) {
  return `${STORAGE_PREFIX}${repositoryKey.toLowerCase()}`
}

export function loadReviewedCommits(repositoryKey: string, storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(questStorageKey(repositoryKey)) || '[]')
    return new Set<string>(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

export function saveReviewedCommits(
  repositoryKey: string,
  reviewed: Set<string>,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  try {
    storage.setItem(questStorageKey(repositoryKey), JSON.stringify([...reviewed]))
  } catch {
    // Local progress is optional; private browsing or storage limits should not break exploration.
  }
}
