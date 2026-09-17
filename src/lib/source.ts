import type { RepoFile, Repository } from '../types'

export type SourceTokenKind = 'plain' | 'comment' | 'string' | 'number' | 'keyword'
export type SourceToken = { text: string; kind: SourceTokenKind }

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'pdf', 'zip', 'gz', 'tar', '7z',
  'mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm', 'woff', 'woff2', 'ttf', 'otf', 'exe', 'dll',
])

const KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from',
  'function', 'if', 'implements', 'import', 'in', 'interface', 'let', 'match', 'new', 'null',
  'package', 'private', 'protected', 'public', 'return', 'self', 'static', 'struct', 'switch',
  'this', 'throw', 'true', 'try', 'type', 'undefined', 'var', 'void', 'while', 'with', 'yield',
])

function encodePath(value: string) {
  return value.split('/').map(encodeURIComponent).join('/')
}

export function githubSourceUrl(repository: Pick<Repository, 'owner' | 'name' | 'defaultBranch'>, path: string) {
  return `https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/blob/${encodePath(repository.defaultBranch)}/${encodePath(path)}`
}

export function rawSourceUrl(repository: Pick<Repository, 'owner' | 'name' | 'defaultBranch'>, path: string) {
  return `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${encodePath(repository.defaultBranch)}/${encodePath(path)}`
}

export function sourceLanguage(path: string) {
  const name = path.split('/').pop()?.toLowerCase() ?? ''
  if (/\.(tsx?|mts|cts)$/.test(name)) return 'typescript'
  if (/\.(jsx?|mjs|cjs)$/.test(name)) return 'javascript'
  if (/\.jsonc?$/.test(name)) return 'json'
  if (/\.css$/.test(name)) return 'css'
  if (/\.(html?|vue|svelte)$/.test(name)) return 'markup'
  if (/\.py$/.test(name)) return 'python'
  if (/\.(ya?ml)$/.test(name)) return 'yaml'
  if (/\.(md|mdx)$/.test(name)) return 'markdown'
  if (/\.go$/.test(name)) return 'go'
  if (/\.rs$/.test(name)) return 'rust'
  if (/\.(java|kt|kts)$/.test(name)) return 'jvm'
  if (/\.(sh|bash|zsh)$/.test(name)) return 'shell'
  return 'text'
}

export function isPreviewableSource(file: Pick<RepoFile, 'path' | 'size'>, maxBytes = 350_000) {
  const extension = file.path.split('.').pop()?.toLowerCase() ?? ''
  return file.size <= maxBytes && !BINARY_EXTENSIONS.has(extension)
}

export function changedLinesFromPatch(patch?: string) {
  if (!patch) return []
  const changed = new Set<number>()
  let newLine = 0

  patch.split('\n').forEach((line) => {
    const hunk = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/)
    if (hunk) {
      newLine = Number(hunk[1])
      return
    }
    if (!newLine || line.startsWith('\\ No newline')) return
    if (line.startsWith('+') && !line.startsWith('+++')) {
      changed.add(newLine)
      newLine += 1
      return
    }
    if (line.startsWith('-') && !line.startsWith('---')) return
    newLine += 1
  })

  return [...changed]
}

export function highlightSourceLine(line: string, language: string): SourceToken[] {
  const commentPrefix = ['python', 'yaml', 'shell'].includes(language) ? '#' : '//'
  const pattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g
  const tokens: SourceToken[] = []
  const commentIndex = line.indexOf(commentPrefix)
  const code = commentIndex >= 0 ? line.slice(0, commentIndex) : line
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(code))) {
    if (match.index > cursor) tokens.push({ text: code.slice(cursor, match.index), kind: 'plain' })
    const text = match[0]
    const kind: SourceTokenKind = text.startsWith('"') || text.startsWith("'") || text.startsWith('`')
      ? 'string'
      : /^\d/.test(text)
        ? 'number'
        : KEYWORDS.has(text)
          ? 'keyword'
          : 'plain'
    tokens.push({ text, kind })
    cursor = match.index + text.length
  }
  if (cursor < code.length) tokens.push({ text: code.slice(cursor), kind: 'plain' })
  if (commentIndex >= 0) tokens.push({ text: line.slice(commentIndex), kind: 'comment' })
  return tokens.length ? tokens : [{ text: line || ' ', kind: 'plain' }]
}
