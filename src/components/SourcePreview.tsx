import { useEffect, useMemo, useRef, useState } from 'react'
import type { RepoFile, Repository } from '../types'
import { formatBytes } from '../lib/map'
import { githubSourceUrl, highlightSourceLine, isPreviewableSource, rawSourceUrl, sourceLanguage } from '../lib/source'

const MAX_RENDERED_LINES = 2_000

type Props = {
  repository: Repository
  files: RepoFile[]
  initialPath: string
  onClose: () => void
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.append(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

export function SourcePreview({ repository, files, initialPath, onClose }: Props) {
  const initialIndex = Math.max(0, files.findIndex((file) => file.path === initialPath))
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const currentFile = files[currentIndex] ?? files[0]
  const language = currentFile ? sourceLanguage(currentFile.path) : 'text'
  const change = currentFile ? repository.recentFileChanges[currentFile.path] : undefined
  const changedLines = useMemo(() => new Set(change?.changedLines ?? []), [change])
  const lines = useMemo(() => source.split('\n').slice(0, MAX_RENDERED_LINES), [source])
  const wasTruncated = source.split('\n').length > MAX_RENDERED_LINES

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (!currentFile) return
    setCopied(false)
    setSource('')
    setError('')
    if (!isPreviewableSource(currentFile)) {
      setLoading(false)
      setError('This file is binary or too large for the in-site preview.')
      return
    }

    const controller = new AbortController()
    setLoading(true)
    fetch(rawSourceUrl(repository, currentFile.path), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
        const text = await response.text()
        if (text.includes('\0')) throw new Error('This file appears to be binary')
        setSource(text)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const detail = reason instanceof Error ? reason.message : 'Unknown error'
        setError(`Preview unavailable. ${detail}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [currentFile, repository])

  if (!currentFile) return null

  const move = (direction: -1 | 1) => {
    setCurrentIndex((index) => Math.min(files.length - 1, Math.max(0, index + direction)))
  }

  return (
    <div className="source-preview-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="source-preview" role="dialog" aria-modal="true" aria-labelledby="source-preview-title">
        <header className="source-preview-header">
          <div>
            <span className="source-preview-kicker">FIELD NOTES · SOURCE PREVIEW</span>
            <h2 id="source-preview-title">{currentFile.path.split('/').pop()}</h2>
            <div className="source-preview-path" title={currentFile.path}>{currentFile.path}</div>
          </div>
          <button ref={closeButton} className="source-close" type="button" onClick={onClose} aria-label="Close source preview">×</button>
        </header>

        <div className="source-meta">
          <span>{language.toUpperCase()}</span>
          <span>{formatBytes(currentFile.size)}</span>
          {change && (
            <span className="source-change-summary">
              {change.status.toUpperCase()} <b>+{change.additions}</b> <i>−{change.deletions}</i>
            </span>
          )}
        </div>

        <div className="source-actions">
          <button
            type="button"
            onClick={() => copyText(currentFile.path).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1_600)
            }).catch(() => setError('Could not copy the file path.'))}
          >{copied ? 'PATH COPIED' : 'COPY PATH'}</button>
          <a href={githubSourceUrl(repository, currentFile.path)} target="_blank" rel="noreferrer">OPEN ON GITHUB ↗</a>
        </div>

        <div className={`source-code-shell${loading || error ? ' source-code-state' : ''}`}>
          {loading && <div className="source-loading"><i />Reading the scroll…</div>}
          {!loading && error && (
            <div className="source-error">
              <strong>PREVIEW BLOCKED</strong>
              <p>{error}</p>
              <a href={githubSourceUrl(repository, currentFile.path)} target="_blank" rel="noreferrer">Open this file on GitHub ↗</a>
            </div>
          )}
          {!loading && !error && (
            <pre className="source-code" aria-label={`Source code for ${currentFile.path}`}>
              {lines.map((line, index) => {
                const lineNumber = index + 1
                return (
                  <code className={`source-line${changedLines.has(lineNumber) ? ' changed-line' : ''}`} key={lineNumber}>
                    <span className="source-line-number">{lineNumber}</span>
                    <span className="source-line-content">
                      {highlightSourceLine(line, language).map((token, tokenIndex) => (
                        <span className={`token-${token.kind}`} key={`${lineNumber}-${tokenIndex}`}>{token.text}</span>
                      ))}
                    </span>
                  </code>
                )
              })}
            </pre>
          )}
          {!loading && !error && wasTruncated && <div className="source-truncated">Showing the first {MAX_RENDERED_LINES.toLocaleString()} lines.</div>}
        </div>

        <footer className="source-preview-nav">
          <button type="button" disabled={currentIndex === 0} onClick={() => move(-1)} aria-label="Preview previous recommended file">
            <span>← PREVIOUS</span><small>{files[currentIndex - 1]?.path.split('/').pop() ?? 'Start of route'}</small>
          </button>
          <div><b>{currentIndex + 1}</b><span>/</span>{files.length}</div>
          <button type="button" disabled={currentIndex === files.length - 1} onClick={() => move(1)} aria-label="Preview next recommended file">
            <span>NEXT →</span><small>{files[currentIndex + 1]?.path.split('/').pop() ?? 'End of route'}</small>
          </button>
        </footer>
      </section>
    </div>
  )
}
