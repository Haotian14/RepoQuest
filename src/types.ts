export type RepoFile = {
  path: string
  size: number
  type: 'blob' | 'tree'
}

export type RecentFileChange = {
  path: string
  status: string
  additions: number
  deletions: number
  changedLines: number[]
}

export type CommitQuest = {
  sha: string
  message: string
  author: string
  avatarUrl?: string
  date: string
  url: string
}

export type BossEncounter = {
  id: string
  number: number
  kind: 'issue' | 'pull_request'
  title: string
  author: string
  avatarUrl?: string
  updatedAt: string
  comments: number
  labels: string[]
  url: string
}

export type Repository = {
  owner: string
  name: string
  description: string
  stars: number
  language: string
  defaultBranch: string
  files: RepoFile[]
  commits: CommitQuest[]
  bosses: BossEncounter[]
  warnings: string[]
  recentChangedPaths: string[]
  recentFileChanges: Record<string, RecentFileChange>
}

export type District = {
  id: string
  label: string
  path: string
  kind: 'directory' | 'files'
  canEnter: boolean
  files: RepoFile[]
  fileCount: number
  totalSize: number
  color: string
  x: number
  y: number
  level: number
}
