import type { District } from '../types'
import { formatBytes } from '../lib/map'

export function Inspector({ district }: { district?: District }) {
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
      <a className="map-return" href="#repository-map">RETURN TO MAP</a>
    </aside>
  )
}
