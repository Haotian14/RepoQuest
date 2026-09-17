import type { RepoFile, Repository } from '../types'
import { isPreviewableSource, rawSourceUrl } from './source'

export type RepositoryAnalysis = {
  filesRead: string[]
  techStack: string[]
  startCommands: string[]
  entryPoints: string[]
  coreModules: string[]
  testEntries: string[]
}

const ENTRY_FILE = /(^|\/)(main|index|app|server|client|bootstrap)\.[^.]+$/i
const TEST_FILE = /(?:^|[._/-])(test|spec)(?:[._/-]|$)|__tests__|^(vitest|jest|playwright)\.config/i

function candidateScore(file: RepoFile) {
  const path = file.path.toLowerCase()
  const name = path.split('/').pop() ?? path
  if (/^readme(?:\.|$)/.test(name)) return 120
  if (/^(package\.json|pyproject\.toml|cargo\.toml|go\.mod|composer\.json)$/.test(name)) return 115
  if (/^(tsconfig(?:\.[^.]+)?\.json)$/.test(name)) return 105
  if (ENTRY_FILE.test(path)) return path.split('/').length <= 2 ? 100 : 82
  if (/^(vite|next|webpack|rollup|astro|svelte|vitest|jest|playwright)\.config/.test(name)) return 90
  if (TEST_FILE.test(path)) return 65
  return 0
}

export function selectAnalysisFiles(repository: Repository, limit = 10) {
  return repository.files
    .filter((file) => candidateScore(file) > 0 && isPreviewableSource(file, 160_000))
    .sort((left, right) => candidateScore(right) - candidateScore(left) || left.path.localeCompare(right.path))
    .slice(0, limit)
}

function packageSignals(source: string, analysis: RepositoryAnalysis) {
  try {
    const manifest = JSON.parse(source) as {
      scripts?: Record<string, string>
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
    const stackByDependency: Record<string, string> = {
      typescript: 'TypeScript', react: 'React', next: 'Next.js', vue: 'Vue', svelte: 'Svelte',
      vite: 'Vite', vitest: 'Vitest', jest: 'Jest', express: 'Express', tailwindcss: 'Tailwind CSS',
      '@nestjs/core': 'NestJS', '@playwright/test': 'Playwright', electron: 'Electron',
    }
    Object.entries(stackByDependency).forEach(([dependency, label]) => {
      if (dependency in dependencies) analysis.techStack.push(label)
    })
    ;['dev', 'start', 'serve', 'build'].forEach((name) => {
      if (manifest.scripts?.[name]) analysis.startCommands.push(`npm run ${name} — ${manifest.scripts[name]}`)
    })
  } catch {
    // Invalid or commented manifests are still useful to the source reader, just not to JSON analysis.
  }
}

function collectImports(source: string, modules: Set<string>) {
  source.split('\n').forEach((line) => {
    const match = line.match(/\b(?:import|export)\b.*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/)
    const specifier = match?.[1] ?? match?.[2] ?? match?.[3]
    if (specifier?.startsWith('.')) modules.add(specifier)
  })
}

export function analyzeRepositorySources(repository: Repository, sources: Record<string, string>): RepositoryAnalysis {
  const analysis: RepositoryAnalysis = {
    filesRead: Object.keys(sources),
    techStack: [],
    startCommands: [],
    entryPoints: [],
    coreModules: [],
    testEntries: [],
  }
  const modules = new Set<string>()

  Object.entries(sources).forEach(([path, source]) => {
    const lowerPath = path.toLowerCase()
    if (lowerPath.endsWith('package.json')) packageSignals(source, analysis)
    if (/tsconfig(?:\.[^.]+)?\.json$/i.test(path)) analysis.techStack.push('TypeScript')
    if (ENTRY_FILE.test(path)) analysis.entryPoints.push(path)
    if (TEST_FILE.test(path)) analysis.testEntries.push(path)
    collectImports(source, modules)
  })

  repository.files.forEach((file) => {
    if (analysis.testEntries.length < 4 && TEST_FILE.test(file.path) && !analysis.testEntries.includes(file.path)) {
      analysis.testEntries.push(file.path)
    }
  })

  if (!analysis.techStack.length && repository.language && repository.language !== 'Mixed') {
    analysis.techStack.push(repository.language)
  }
  analysis.techStack = [...new Set(analysis.techStack)].slice(0, 6)
  analysis.entryPoints = [...new Set(analysis.entryPoints)].slice(0, 4)
  analysis.testEntries = [...new Set(analysis.testEntries)].slice(0, 4)
  analysis.coreModules = [...modules].slice(0, 6)
  return analysis
}

const analysisCache = new Map<string, RepositoryAnalysis>()

export async function loadRepositoryAnalysis(repository: Repository, signal?: AbortSignal) {
  const cacheKey = `${repository.owner}/${repository.name}@${repository.defaultBranch}`.toLowerCase()
  const cached = analysisCache.get(cacheKey)
  if (cached) return cached

  const candidates = selectAnalysisFiles(repository)
  const settled = await Promise.all(candidates.map(async (file) => {
    try {
      const response = await fetch(rawSourceUrl(repository, file.path), { signal })
      if (!response.ok) return undefined
      const source = await response.text()
      if (source.includes('\0')) return undefined
      return [file.path, source] as const
    } catch (error) {
      if (signal?.aborted) throw error
      return undefined
    }
  }))
  const sources = Object.fromEntries(settled.filter((result): result is readonly [string, string] => Boolean(result)))
  const analysis = analyzeRepositorySources(repository, sources)
  if (!signal?.aborted && analysis.filesRead.length) analysisCache.set(cacheKey, analysis)
  return analysis
}
