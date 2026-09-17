import { useEffect, useMemo, useState } from 'react'
import type { District, Repository } from '../types'
import { formatBytes } from '../lib/map'
import { buildDistrictGuide } from '../lib/guide'
import { loadRepositoryAnalysis, type RepositoryAnalysis } from '../lib/analysis'
import { SourcePreview } from './SourcePreview'

export function Inspector({ district, repository }: { district?: District; repository: Repository }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const [previewPath, setPreviewPath] = useState<string>()
  const [analysis, setAnalysis] = useState<RepositoryAnalysis>()
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisNotice, setAnalysisNotice] = useState('')
  const repositoryKey = `${repository.owner}/${repository.name}@${repository.defaultBranch}`
  const guide = useMemo(() => district ? buildDistrictGuide(district, analysis) : undefined, [analysis, district])
  const recentPaths = useMemo(() => new Set(repository.recentChangedPaths), [repository.recentChangedPaths])
  const nearbyFiles = useMemo(() => district ? [...district.files].sort((left, right) => {
    const recentDifference = Number(recentPaths.has(right.path)) - Number(recentPaths.has(left.path))
    return recentDifference || left.path.localeCompare(right.path)
  }) : [], [district, recentPaths])
  const guideFiles = useMemo(() => guide ? guide.keyFiles.flatMap((suggestion) => {
    const file = district?.files.find((candidate) => candidate.path === suggestion.path)
    return file ? [file] : []
  }) : [], [district, guide])

  useEffect(() => {
    setGuideOpen(false)
    setPreviewPath(undefined)
  }, [district?.id])

  useEffect(() => {
    setAnalysis(undefined)
    setAnalysisNotice('')
  }, [repositoryKey])

  useEffect(() => {
    if (!guideOpen || analysis) return
    const controller = new AbortController()
    setAnalysisLoading(true)
    setAnalysisNotice('')
    loadRepositoryAnalysis(repository, controller.signal)
      .then((result) => {
        setAnalysis(result)
        if (!result.filesRead.length) setAnalysisNotice('Key files could not be read; showing metadata-based guidance.')
      })
      .catch(() => {
        if (!controller.signal.aborted) setAnalysisNotice('Static analysis is unavailable; showing metadata-based guidance.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setAnalysisLoading(false)
      })
    return () => controller.abort()
  }, [analysis, guideOpen, repository, repositoryKey])

  if (!district) {
    return (
      <aside className="inspector empty" aria-live="polite" tabIndex={-1}>
        <div className="quest-icon"><i /></div>
        <span className="inspector-kicker">EXPLORER'S JOURNAL</span>
        <h2>Choose a destination</h2>
        <p>Walk toward a building or select one on the map. Every district represents a folder in this repository.</p>
        <div className="journal-tip"><kbd>WASD</kbd><span>move</span><kbd>E</kbd><span>open</span></div>
      </aside>
    )
  }

  return (
    <>
    <aside className="inspector" aria-live="polite" tabIndex={-1}>
      <div className="inspector-kicker">DISTRICT DISCOVERED</div>
      <h2>{district.label}</h2>
      <div className="district-path">/{district.path}</div>
      <div className="stats-grid">
        <div><strong>{district.fileCount}</strong><span>files</span></div>
        <div><strong>{formatBytes(district.totalSize)}</strong><span>size</span></div>
        <div><strong>LV.{district.level}</strong><span>district</span></div>
      </div>
      <div className="file-list">
        <h3>Nearby places</h3>
        {nearbyFiles.slice(0, 7).map((file) => {
          const changedRecently = recentPaths.has(file.path)
          return (
          <button
            type="button"
            className={`file-row${changedRecently ? ' recent-file' : ''}`}
            key={file.path}
            onClick={() => setPreviewPath(file.path)}
            aria-label={`Preview nearby file ${file.path}${changedRecently ? ', changed in the latest commit' : ''}`}
          >
            <span className="file-gem" />
            <span title={file.path}>{file.path.split('/').pop()}</span>
            <b className={`file-change${changedRecently ? '' : ' placeholder'}`}>{changedRecently ? 'CHANGED' : ''}</b>
            <small>{formatBytes(file.size)}</small>
            <span className="file-open" aria-hidden="true">›</span>
          </button>
          )
        })}
        {district.files.length > 7 && <div className="more-files">+ {district.files.length - 7} more files</div>}
      </div>
      <button
        className="guide-toggle"
        type="button"
        aria-expanded={guideOpen}
        aria-controls="district-guide"
        onClick={() => setGuideOpen((current) => !current)}
      >
        <span>{guideOpen ? 'CLOSE SMART GUIDE' : 'OPEN SMART GUIDE'}</span>
        <i aria-hidden="true">{guideOpen ? '−' : '+'}</i>
      </button>
      {guideOpen && guide && (
        <section className="district-guide" id="district-guide">
          <div className="guide-status"><span />{
            analysisLoading
              ? 'READING KEY FILES LOCALLY…'
              : analysis?.filesRead.length
                ? `STATIC ANALYSIS · ${analysis.filesRead.length} FILES`
                : 'LOCAL ANALYSIS · NO API KEY'
          }</div>
          <div className="guide-role">{guide.role}</div>
          <p>{guide.summary}</p>
          {analysisLoading && <div className="guide-analysis-loading"><i /><span>Tracing manifests, entries, and imports…</span></div>}
          {analysis && analysis.filesRead.length > 0 && (
            <div className="guide-facts" aria-label="Repository static analysis">
              <div><span>TECH STACK</span><strong>{analysis.techStack.join(' · ') || repository.language}</strong></div>
              <div><span>START COMMAND</span><strong>{analysis.startCommands[0] || 'No start script detected'}</strong></div>
              <div><span>STARTUP ENTRY</span><strong>{analysis.entryPoints.join(' · ') || 'No conventional entry detected'}</strong></div>
              <div><span>CORE IMPORTS</span><strong>{analysis.coreModules.join(' · ') || 'No local imports detected'}</strong></div>
              <div><span>TEST ENTRY</span><strong>{analysis.testEntries.join(' · ') || 'No test entry detected'}</strong></div>
            </div>
          )}
          {analysisNotice && <div className="guide-analysis-notice">{analysisNotice}</div>}
          <h3>Suggested route</h3>
          <ol className="guide-route">
            {guide.keyFiles.map((file) => (
              <li key={file.path}>
                <div className="route-number" aria-hidden="true" />
                <div>
                  <button
                    type="button"
                    className="guide-file-link"
                    onClick={() => setPreviewPath(file.path)}
                    title={file.path}
                    aria-label={`Preview suggested file ${file.path}`}
                  >
                    {file.path}<span className="guide-open" aria-hidden="true">›</span>
                  </button>
                  <span className="guide-reason">{file.reason}</span>
                </div>
              </li>
            ))}
          </ol>
          <h3>Explorer notes</h3>
          <ul className="guide-notes">
            {guide.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
          <div className="guide-method">LOCAL STATIC ANALYSIS: MANIFEST · CONFIG · ENTRY · IMPORTS</div>
        </section>
      )}
      <a
        className="map-return"
        href="#repository-map"
        onClick={() => window.requestAnimationFrame(() => document.getElementById('repository-map')?.focus({ preventScroll: true }))}
      >RETURN TO MAP</a>
    </aside>
    {previewPath && (
      <SourcePreview
        repository={repository}
        files={guideFiles.some((file) => file.path === previewPath) ? guideFiles : nearbyFiles}
        initialPath={previewPath}
        onClose={() => setPreviewPath(undefined)}
      />
    )}
    </>
  )
}
