import type { District } from '../types'
import { formatBytes } from '../lib/map'

export function Inspector({ district }: { district?: District }) {
  if (!district) {
    return (
      <aside className="inspector empty">
        <div className="quest-icon">⌕</div>
        <h2>Choose your destination</h2>
        <p>Each building is a folder in this little valley. Larger buildings hold more files and secrets.</p>
      </aside>
    )
  }

  return (
    <aside className="inspector">
      <div className="inspector-kicker">✦ DISTRICT DISCOVERED ✦</div>
      <h2>{district.label}</h2>
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
    </aside>
  )
}
