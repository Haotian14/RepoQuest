import { useRef, useState } from 'react'
import { explorerDirectionRow, explorerSprite } from '../art'
import { depthForY } from '../lib/depth'
import { shareFilename } from '../lib/share'
import type { District, Repository } from '../types'
import { Building } from './Building'

type ExportState = 'idle' | 'exporting' | 'success' | 'error'

export function ShareMap({ repository, districts }: { repository: Repository; districts: District[] }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ExportState>('idle')

  async function downloadMap() {
    if (!cardRef.current || state === 'exporting') return
    setState('exporting')
    try {
      const { toPng } = await import('html-to-image')
      await document.fonts?.ready
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 800,
        canvasWidth: 2400,
        canvasHeight: 1600,
        pixelRatio: 1,
        backgroundColor: '#173b2d',
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = shareFilename(repository.owner, repository.name)
      link.href = dataUrl
      link.click()
      setState('success')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      <section className="share-panel" aria-labelledby="share-title">
        <div className="share-icon" aria-hidden="true"><i /><span>PNG</span></div>
        <div className="share-copy">
          <span className="section-index">POSTCARD 01</span>
          <h2 id="share-title">Take the valley with you</h2>
          <p>Export a 2400 × 1600 pixel expedition card with the complete map and repository stats.</p>
          <div className={`share-status ${state}`} role="status" aria-live="polite">
            {state === 'success' && 'Your map card is ready.'}
            {state === 'error' && 'The map could not be exported. Please try again.'}
          </div>
        </div>
        <button className="share-download" type="button" onClick={downloadMap} disabled={state === 'exporting'}>
          <span>{state === 'exporting' ? 'DRAWING MAP…' : 'DOWNLOAD MAP'}</span>
          <i aria-hidden="true">↓</i>
        </button>
      </section>

      <div className="share-export-shell" aria-hidden="true">
        <div className="share-export-card" ref={cardRef}>
          <aside className="share-sidebar">
            <div className="share-brand"><span>RQ</span><div><b>RepoQuest</b><small>CODE VALLEY</small></div></div>
            <div className="share-expedition-label">EXPEDITION REPORT</div>
            <div className="share-repository-name"><span>{repository.owner} /</span><strong>{repository.name}</strong></div>
            <p>{repository.description}</p>
            <div className="share-sidebar-metrics">
              <div><strong>{repository.stars.toLocaleString()}</strong><span>STARS</span></div>
              <div><strong>{repository.language}</strong><span>LANGUAGE</span></div>
              <div><strong>{repository.files.length}</strong><span>FILES</span></div>
              <div><strong>{districts.length}</strong><span>DISTRICTS</span></div>
            </div>
            <div className="share-sidebar-note"><i /> Generated from a public GitHub repository</div>
          </aside>

          <div className="share-export-main">
            <section className="world share-world">
              <div className="world-light" />
              {districts.map((district) => (
                <Building key={district.id} district={district} active={false} nearby={false} occluded={false} decorative />
              ))}
              <div className="player share-player" style={{ left: '50%', top: '54%', zIndex: depthForY(54) }}>
                <span
                  className="player-sprite"
                  style={{
                    backgroundImage: `url(${explorerSprite})`,
                    backgroundPosition: `${-48}px ${-explorerDirectionRow.down * 64}px`,
                  }}
                />
              </div>
              <div className="share-map-title"><span>THE REPOSITORY VALLEY</span><b>{repository.owner}/{repository.name}</b></div>
            </section>
            <div className="share-export-footer">
              <div><span>RECENT QUESTS</span><strong>{repository.commits.length}</strong></div>
              <div><span>OPEN BOSSES</span><strong>{repository.bosses.length}</strong></div>
              <p>Every repository is a place waiting to be discovered.</p>
              <b>haotian14.github.io/RepoQuest</b>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
