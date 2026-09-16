import type { District, RepoFile, Repository } from '../types'

const COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#fb7185', '#34d399', '#f472b6', '#facc15', '#60a5fa']
const POSITIONS = [
  // Coordinates represent each building's ground-contact point, not its center.
  [29, 35], [50, 35], [70, 36], [23, 61], [50, 59], [69, 61], [27, 88], [50, 88], [69, 88],
]

export function buildDistricts(repository: Repository): District[] {
  const grouped = new Map<string, RepoFile[]>()

  repository.files.forEach((file) => {
    const [root] = file.path.split('/')
    const key = file.path.includes('/') ? root : 'root'
    grouped.set(key, [...(grouped.get(key) ?? []), file])
  })

  return [...grouped.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, POSITIONS.length)
    .map(([path, files], index) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      return {
        id: `${path}-${index}`,
        label: path === 'root' ? 'Town Hall' : path,
        path,
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

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}
