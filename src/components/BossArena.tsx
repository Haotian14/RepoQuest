import { useEffect, useMemo, useState } from 'react'
import { bossThreat, loadDefeatedBosses, saveDefeatedBosses } from '../lib/bosses'
import type { Repository } from '../types'

function formatUpdated(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'UNKNOWN'
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(date).toUpperCase()
}

export function BossArena({ repository }: { repository: Repository }) {
  const repositoryKey = `${repository.owner}/${repository.name}`
  const [defeated, setDefeated] = useState<Set<string>>(() => loadDefeatedBosses(repositoryKey))

  useEffect(() => setDefeated(loadDefeatedBosses(repositoryKey)), [repositoryKey])

  const defeatedCount = useMemo(
    () => repository.bosses.filter((boss) => defeated.has(boss.id)).length,
    [defeated, repository.bosses],
  )
  const issueCount = repository.bosses.filter((boss) => boss.kind === 'issue').length
  const pullCount = repository.bosses.length - issueCount

  function toggleVictory(id: string) {
    setDefeated((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveDefeatedBosses(repositoryKey, next)
      return next
    })
  }

  return (
    <section className="boss-arena" id="arena" aria-labelledby="arena-title">
      <header className="arena-heading">
        <div>
          <span className="section-index">ARENA 01</span>
          <h2 id="arena-title">Issue &amp; PR Boss Arena</h2>
          <p>Face the repository's most discussed open challenges.</p>
        </div>
        <div className="arena-score" aria-live="polite">
          <div><strong>{defeatedCount}</strong><span>VICTORIES</span></div>
          <div><strong>{issueCount}</strong><span>ISSUES</span></div>
          <div><strong>{pullCount}</strong><span>PRs</span></div>
        </div>
      </header>

      <div className="boss-grid">
        {repository.bosses.length === 0 && (
          <div className="arena-empty"><span>✦</span><b>The arena is quiet</b><p>No open Issue or PR bosses were returned.</p></div>
        )}
        {repository.bosses.map((boss) => {
          const victory = defeated.has(boss.id)
          const threat = bossThreat(boss)
          return (
            <article className={`boss-card ${boss.kind}${victory ? ' defeated' : ''}`} key={boss.id}>
              <div className="boss-card-top">
                <span>{boss.kind === 'pull_request' ? 'PULL REQUEST' : 'ISSUE'} #{boss.number}</span>
                <b>LV.{threat.level} · {threat.title}</b>
              </div>
              <div className="boss-body">
                <div className="boss-sprite" aria-hidden="true"><i /><span /></div>
                <div className="boss-copy">
                  <h3>{boss.title}</h3>
                  <p>SUMMONED BY {boss.author} · {formatUpdated(boss.updatedAt)}</p>
                  <div className="boss-labels">
                    {boss.labels.slice(0, 3).map((label) => <span key={label}>{label}</span>)}
                    {boss.labels.length === 0 && <span>unclassified</span>}
                  </div>
                </div>
              </div>
              <div className="boss-health">
                <div><b>HP</b><span>{victory ? 0 : threat.health} / {threat.health}</span></div>
                <div className="boss-health-track"><i style={{ width: `${victory ? 0 : 100}%` }} /></div>
              </div>
              <div className="boss-actions">
                <a href={boss.url} target="_blank" rel="noreferrer">CHALLENGE <span>↗</span></a>
                <button type="button" aria-pressed={victory} onClick={() => toggleVictory(boss.id)}>{victory ? 'UNDO VICTORY' : 'LOG VICTORY'}</button>
              </div>
              <small>{boss.comments} discussion replies · Local battle record only</small>
            </article>
          )
        })}
      </div>
    </section>
  )
}
