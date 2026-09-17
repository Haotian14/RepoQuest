import type { BossEncounter, CommitQuest, District, Repository } from '../types'

const SNAPSHOT_PREFIX = 'repoquest:snapshot:'
const SNAPSHOT_VERSION = 1

export type ExplorationLocation = {
  mapPath: string
  selectedPath?: string
  selectedKind?: District['kind']
}

export type RepositorySnapshot = {
  version: number
  visitedAt: string
  files: Array<[string, number]>
  commitShas: string[]
  bossIds: string[]
  exploration: ExplorationLocation
}

export type ChangedArea = { path: string; count: number }

export type RepositoryChangeReport = {
  hasPreviousVisit: boolean
  previousVisit?: string
  addedFiles: string[]
  removedFiles: string[]
  modifiedFiles: string[]
  changedAreas: ChangedArea[]
  newCommits: CommitQuest[]
  newIssues: BossEncounter[]
  newPullRequests: BossEncounter[]
  previousExploration?: ExplorationLocation
}

function snapshotKey(repository: Pick<Repository, 'owner' | 'name'>) {
  return `${SNAPSHOT_PREFIX}${encodeURIComponent(`${repository.owner}/${repository.name}`.toLowerCase())}`
}

function areaFor(path: string) {
  return path.includes('/') ? path.split('/')[0] : 'root'
}

export function loadRepositorySnapshot(repository: Pick<Repository, 'owner' | 'name'>): RepositorySnapshot | undefined {
  try {
    const value = localStorage.getItem(snapshotKey(repository))
    if (!value) return undefined
    const parsed = JSON.parse(value) as RepositorySnapshot
    if (parsed.version !== SNAPSHOT_VERSION || !Array.isArray(parsed.files)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function compareRepositorySnapshot(repository: Repository, previous?: RepositorySnapshot): RepositoryChangeReport {
  if (!previous) {
    return {
      hasPreviousVisit: false,
      addedFiles: [], removedFiles: [], modifiedFiles: [], changedAreas: [],
      newCommits: [], newIssues: [], newPullRequests: [],
    }
  }

  const oldFiles = new Map(previous.files)
  const currentFiles = new Map(repository.files.map((file) => [file.path, file.size]))
  const addedFiles = repository.files.filter((file) => !oldFiles.has(file.path)).map((file) => file.path)
  const modifiedFiles = repository.files
    .filter((file) => oldFiles.has(file.path) && oldFiles.get(file.path) !== file.size)
    .map((file) => file.path)
  const removedFiles = previous.files.filter(([path]) => !currentFiles.has(path)).map(([path]) => path)
  const changedAreaCounts = new Map<string, number>()
  ;[...addedFiles, ...modifiedFiles, ...removedFiles].forEach((path) => {
    const area = areaFor(path)
    changedAreaCounts.set(area, (changedAreaCounts.get(area) ?? 0) + 1)
  })
  const previousCommits = new Set(previous.commitShas)
  const previousBosses = new Set(previous.bossIds)
  const newBosses = repository.bosses.filter((boss) => !previousBosses.has(boss.id))

  return {
    hasPreviousVisit: true,
    previousVisit: previous.visitedAt,
    addedFiles,
    removedFiles,
    modifiedFiles,
    changedAreas: [...changedAreaCounts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((left, right) => right.count - left.count || left.path.localeCompare(right.path)),
    newCommits: repository.commits.filter((commit) => !previousCommits.has(commit.sha)),
    newIssues: newBosses.filter((boss) => boss.kind === 'issue'),
    newPullRequests: newBosses.filter((boss) => boss.kind === 'pull_request'),
    previousExploration: previous.exploration,
  }
}

export function saveRepositorySnapshot(repository: Repository, exploration?: ExplorationLocation) {
  const previous = loadRepositorySnapshot(repository)
  const snapshot: RepositorySnapshot = {
    version: SNAPSHOT_VERSION,
    visitedAt: new Date().toISOString(),
    files: repository.files.map((file) => [file.path, file.size]),
    commitShas: repository.commits.map((commit) => commit.sha),
    bossIds: repository.bosses.map((boss) => boss.id),
    exploration: exploration ?? previous?.exploration ?? { mapPath: '' },
  }
  try {
    localStorage.setItem(snapshotKey(repository), JSON.stringify(snapshot))
  } catch {
    // Tracking is an enhancement; private browsing and storage limits must not block exploration.
  }
}

export function saveExplorationLocation(repository: Repository, exploration: ExplorationLocation) {
  const snapshot = loadRepositorySnapshot(repository)
  if (!snapshot) return
  try {
    localStorage.setItem(snapshotKey(repository), JSON.stringify({ ...snapshot, exploration }))
  } catch {
    // Ignore storage restrictions.
  }
}
