export type RepoFile = {
  path: string
  size: number
  type: 'blob' | 'tree'
}

export type Repository = {
  owner: string
  name: string
  description: string
  stars: number
  language: string
  defaultBranch: string
  files: RepoFile[]
}

export type District = {
  id: string
  label: string
  path: string
  files: RepoFile[]
  fileCount: number
  totalSize: number
  color: string
  x: number
  y: number
  level: number
}
