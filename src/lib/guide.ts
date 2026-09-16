import type { District, RepoFile } from '../types'

export type GuideFile = {
  path: string
  reason: string
}

export type DistrictGuide = {
  role: string
  summary: string
  keyFiles: GuideFile[]
  notes: string[]
}

type DistrictProfile = {
  role: string
  summary: string
  matches: (path: string) => boolean
}

const PROFILES: DistrictProfile[] = [
  {
    role: 'PROJECT COMPASS',
    summary: 'Start here to understand the project contract, toolchain, and the commands that hold the repository together.',
    matches: (path) => path === 'root',
  },
  {
    role: 'QUALITY OUTPOST',
    summary: 'This district documents expected behavior. Read it early when you need confidence before changing implementation code.',
    matches: (path) => /^(test|tests|spec|specs|e2e|__tests__)$/i.test(path),
  },
  {
    role: 'KNOWLEDGE ARCHIVE',
    summary: 'This district explains intent, workflows, and decisions that may not be obvious from the code alone.',
    matches: (path) => /^(doc|docs|guide|guides|wiki)$/i.test(path),
  },
  {
    role: 'ASSET GARDENS',
    summary: 'Static resources live here. Changes usually affect presentation or shipped files rather than application logic.',
    matches: (path) => /^(public|static|asset|assets|image|images|media)$/i.test(path),
  },
  {
    role: 'AUTOMATION FORGE',
    summary: 'Build, release, and repository automation gather here. Small edits can change how the whole project is delivered.',
    matches: (path) => /^(config|configs|script|scripts|tool|tools|\.github)$/i.test(path),
  },
  {
    role: 'INTERFACE QUARTER',
    summary: 'This district shapes what people see and interact with. Trace outward from entry views into their smaller components.',
    matches: (path) => /^(app|page|pages|view|views|component|components|ui)$/i.test(path),
  },
  {
    role: 'CORE WORKSHOP',
    summary: 'Most product behavior is likely assembled here. Begin at an entry file, then follow imports toward focused modules.',
    matches: (path) => /^(src|source|lib|server|api|core|pkg|packages)$/i.test(path),
  },
]

const ENTRY_NAMES = /^(index|main|app|server|client|root)\.[^.]+$/i
const CONFIG_NAMES = /(^|[.-])(config|rc)([.-]|$)|^(vite|webpack|rollup|eslint|tsconfig|vitest)/i
const TEST_NAMES = /(?:^|[._-])(test|spec)(?:[._-]|$)|__tests__/i

function fileName(path: string) {
  return path.split('/').pop() ?? path
}

function extension(path: string) {
  const name = fileName(path)
  if (/^readme(?:\.|$)/i.test(name)) return 'docs'
  if (!name.includes('.')) return 'other'
  return name.split('.').pop()?.toLowerCase() || 'other'
}

function displayType(type: string) {
  if (type === 'docs') return 'documentation'
  if (type === 'other') return 'extensionless files'
  return `.${type}`
}

function scoreFile(file: RepoFile) {
  const name = fileName(file.path)
  let score = Math.min(20, Math.log2(file.size + 1) * 1.5)
  if (/^readme(?:\.|$)/i.test(name)) score += 110
  if (/^(package\.json|cargo\.toml|pyproject\.toml|go\.mod|composer\.json)$/i.test(name)) score += 100
  if (ENTRY_NAMES.test(name)) score += 80
  if (CONFIG_NAMES.test(name)) score += 55
  if (TEST_NAMES.test(file.path)) score += 35
  return score
}

function reasonFor(file: RepoFile) {
  const name = fileName(file.path)
  if (/^readme(?:\.|$)/i.test(name)) return 'Project intent and the fastest orientation point.'
  if (/^(package\.json|cargo\.toml|pyproject\.toml|go\.mod|composer\.json)$/i.test(name)) {
    return 'Reveals dependencies, scripts, and the project runtime.'
  }
  if (ENTRY_NAMES.test(name)) return 'Likely entry point; use it to trace the main execution path.'
  if (CONFIG_NAMES.test(name)) return 'Defines important build, tooling, or runtime decisions.'
  if (TEST_NAMES.test(file.path)) return 'Shows expected behavior through executable examples.'
  return 'A substantial landmark that should expose the district’s main responsibility.'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export function buildDistrictGuide(district: District): DistrictGuide {
  const profile = PROFILES.find((candidate) => candidate.matches(district.path)) ?? {
    role: 'FEATURE FRONTIER',
    summary: 'This looks like a focused project module. Find its public entry first, then work inward toward implementation details.',
  }

  const rankedFiles = [...district.files]
    .sort((a, b) => scoreFile(b) - scoreFile(a) || a.path.localeCompare(b.path))
    .slice(0, 4)

  const counts = new Map<string, number>()
  district.files.forEach((file) => counts.set(extension(file.path), (counts.get(extension(file.path)) ?? 0) + 1))
  const [dominantType = 'other', dominantCount = 0] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
  const largest = [...district.files].sort((a, b) => b.size - a.size)[0]
  const hasLocalTests = district.files.some((file) => TEST_NAMES.test(file.path))

  const notes = [
    `${district.fileCount} files span ${counts.size} file ${counts.size === 1 ? 'type' : 'types'}; ${displayType(dominantType)} is most common (${dominantCount}).`,
  ]

  if (largest) notes.push(`${fileName(largest.path)} is the largest visible landmark at ${formatSize(largest.size)}.`)
  if (district.fileCount >= 20) notes.push('This is a dense district—follow the route below instead of reading alphabetically.')
  else if (!hasLocalTests) notes.push('No test-like file is visible inside this district; verify behavior in the repository’s test area.')
  else notes.push('Test-like files are present here and can serve as behavior examples.')

  return {
    role: profile.role,
    summary: profile.summary,
    keyFiles: rankedFiles.map((file) => ({ path: file.path, reason: reasonFor(file) })),
    notes,
  }
}
