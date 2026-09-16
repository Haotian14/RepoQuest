import { useEffect, useMemo, useState } from 'react'
import type { District } from '../types'
import { formatBytes } from '../lib/map'
import { buildDistrictGuide } from '../lib/guide'

export function Inspector({ district }: { district?: District }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const guide = useMemo(() => district ? buildDistrictGuide(district) : undefined, [district])

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
        {district.files.slice(0, 7).map((file) => (
          <div className="file-row" key={file.path}>
            <span className="file-gem" />
            <span title={file.path}>{file.path.split('/').pop()}</span>
            <small>{formatBytes(file.size)}</small>
          </div>
        ))}
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
                  <strong title={file.path}>{file.path}</strong>
                  <span>{file.reason}</span>
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
      <a className="map-return" href="#repository-map">RETURN TO MAP</a>
    </aside>
  )
}
