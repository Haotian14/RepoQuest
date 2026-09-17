import type { District, RepoFile, Repository } from '../types'

const COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#fb7185', '#34d399', '#f472b6', '#facc15', '#60a5fa']
const POSITIONS = [
  // Coordinates represent each building's ground-contact point, not its center.
  [29, 35], [50, 35], [70, 36], [23, 61], [50, 59], [69, 61], [27, 88], [50, 88], [69, 88],
]

export function buildDistricts(repository: Repository, currentPath = ''): District[] {
  const grouped = new Map<string, { path: string; kind: District['kind']; files: RepoFile[] }>()
  const prefix = currentPath ? `${currentPath}/` : ''

  repository.files.forEach((file) => {
    if (!file.path.startsWith(prefix)) return
    const relativePath = file.path.slice(prefix.length)
    if (!relativePath) return
    const [nextSegment, ...rest] = relativePath.split('/')
    const kind: District['kind'] = rest.length ? 'directory' : 'files'
    const path = kind === 'directory' ? `${prefix}${nextSegment}` : (currentPath || 'root')
    const key = `${kind}:${path}`
    const group = grouped.get(key) ?? { path, kind, files: [] }
    group.files.push(file)
    grouped.set(key, group)
  })

  return [...grouped.entries()]
    .sort(([, a], [, b]) => b.files.length - a.files.length)
    .slice(0, POSITIONS.length)
    .map(([, group], index) => {
      const { files, kind, path } = group
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const label = kind === 'files'
        ? (currentPath ? 'Local Files' : 'Town Hall')
        : path.split('/').pop() ?? path
      const canEnter = kind === 'directory' && files.some((file) => file.path.slice(path.length + 1).includes('/'))
      return {
        id: `${currentPath || 'root'}:${path}:${kind}`,
        label,
        path,
        kind,
        canEnter,
        files,
        fileCount: files.length,
        totalSize,
        color: COLORS[index % COLORS.length],
        x: POSITIONS[index][0],
        y: POSITIONS[index][1],
        level: Math.min(4, Math.max(1, Math.ceil(Math.log2(files.length + 1) / 2))),
      }
    })
}

export function repositoryTheme(language: string) {
  const value = language.toLowerCase()
  if (value.includes('typescript') || value.includes('javascript')) return 'arcane'
  if (value.includes('python')) return 'forest'
  if (value.includes('rust') || value.includes('go')) return 'forge'
  if (value.includes('java') || value.includes('kotlin')) return 'citadel'
  if (value.includes('html') || value.includes('css') || value.includes('vue')) return 'garden'
  return 'valley'
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}
