const STORAGE_KEY = 'repoquest:recent-repositories'
const MAX_RECENT_REPOSITORIES = 5

export type RecentRepository = {
  owner: string
  name: string
  viewedAt: number
}

function isRecentRepository(value: unknown): value is RecentRepository {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<RecentRepository>
  return typeof candidate.owner === 'string'
    && Boolean(candidate.owner.trim())
    && typeof candidate.name === 'string'
    && Boolean(candidate.name.trim())
    && typeof candidate.viewedAt === 'number'
    && Number.isFinite(candidate.viewedAt)
}

export function recentRepositoryLabel(repository: Pick<RecentRepository, 'owner' | 'name'>) {
  return `${repository.owner}/${repository.name}`
}

export function loadRecentRepositories(storage: Pick<Storage, 'getItem'> = localStorage): RecentRepository[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isRecentRepository)
      .sort((left, right) => right.viewedAt - left.viewedAt)
      .slice(0, MAX_RECENT_REPOSITORIES)
  } catch {
    return []
  }
}

export function rememberRepository(
  repository: Pick<RecentRepository, 'owner' | 'name'>,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
  viewedAt = Date.now(),
) {
  const nextEntry: RecentRepository = {
    owner: repository.owner,
    name: repository.name,
    viewedAt,
  }
  const key = recentRepositoryLabel(nextEntry).toLowerCase()
  const next = [
    nextEntry,
    ...loadRecentRepositories(storage).filter((item) => recentRepositoryLabel(item).toLowerCase() !== key),
  ].slice(0, MAX_RECENT_REPOSITORIES)

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Recent history is optional; storage limits must not block repository exploration.
  }
  return next
}

export function clearRecentRepositories(storage: Pick<Storage, 'removeItem'> = localStorage) {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Recent history is optional and may be unavailable in private browsing.
  }
}
