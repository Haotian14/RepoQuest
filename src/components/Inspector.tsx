import { useEffect, useMemo, useState } from 'react'
import type { District, Repository } from '../types'
import { formatBytes } from '../lib/map'
import { buildDistrictGuide } from '../lib/guide'

function sourceUrl(repository: Repository, path: string) {
  const owner = encodeURIComponent(repository.owner)
  const name = encodeURIComponent(repository.name)
  const branch = repository.defaultBranch.split('/').map(encodeURIComponent).join('/')
  const filePath = path.split('/').map(encodeURIComponent).join('/')
  return `https://github.com/${owner}/${name}/blob/${branch}/${filePath}`
}

export function Inspector({ district, repository }: { district?: District; repository: Repository }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const guide = useMemo(() => district ? buildDistrictGuide(district) : undefined, [district])
  const recentPaths = useMemo(() => new Set(repository.recentChangedPaths), [repository.recentChangedPaths])
  const nearbyFiles = useMemo(() => district ? [...district.files].sort((left, right) => {
    const recentDifference = Number(recentPaths.has(right.path)) - Number(recentPaths.has(left.path))
    return recentDifference || left.path.localeCompare(right.path)
  }) : [], [district, recentPaths])

  useEffect(() => setGuideOpen(false), [district?.id])

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
          <a
            className={`file-row${changedRecently ? ' recent-file' : ''}`}
            key={file.path}
            href={sourceUrl(repository, file.path)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open nearby file ${file.path} on GitHub${changedRecently ? ', changed in the latest commit' : ''}`}
          >
            <span className="file-gem" />
            <span title={file.path}>{file.path.split('/').pop()}</span>
            <b className={`file-change${changedRecently ? '' : ' placeholder'}`}>{changedRecently ? 'CHANGED' : ''}</b>
            <small>{formatBytes(file.size)}</small>
            <span className="file-open" aria-hidden="true">↗</span>
          </a>
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
          <div className="guide-status"><span />LOCAL ANALYSIS · NO API KEY</div>
          <div className="guide-role">{guide.role}</div>
          <p>{guide.summary}</p>
          <h3>Suggested route</h3>
          <ol className="guide-route">
            {guide.keyFiles.map((file) => (
              <li key={file.path}>
                <div className="route-number" aria-hidden="true" />
                <div>
                  <a
                    className="guide-file-link"
                    href={sourceUrl(repository, file.path)}
                    target="_blank"
                    rel="noreferrer"
                    title={file.path}
                    aria-label={`Open suggested file ${file.path} on GitHub`}
                  >
                    {file.path}<span className="guide-open" aria-hidden="true">↗</span>
                  </a>
                  <span className="guide-reason">{file.reason}</span>
                </div>
              </li>
            ))}
          </ol>
          <h3>Explorer notes</h3>
          <ul className="guide-notes">
            {guide.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
          <div className="guide-method">HEURISTICS: PATH · NAME · TYPE · SIZE</div>
        </section>
      )}
      <a
        className="map-return"
        href="#repository-map"
        onClick={() => window.requestAnimationFrame(() => document.getElementById('repository-map')?.focus({ preventScroll: true }))}
      >RETURN TO MAP</a>
    </aside>
  )
}
