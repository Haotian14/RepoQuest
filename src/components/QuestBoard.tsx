import { useEffect, useMemo, useState } from 'react'
import type { Repository } from '../types'
import { loadReviewedCommits, saveReviewedCommits } from '../lib/quests'

function formatQuestDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'UNKNOWN DATE'
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date).toUpperCase()
}

export function QuestBoard({ repository }: { repository: Repository }) {
  const repositoryKey = `${repository.owner}/${repository.name}`
  const [reviewed, setReviewed] = useState<Set<string>>(() => loadReviewedCommits(repositoryKey))

  useEffect(() => setReviewed(loadReviewedCommits(repositoryKey)), [repositoryKey])

  const reviewedCount = useMemo(
    () => repository.commits.filter((commit) => reviewed.has(commit.sha)).length,
    [repository.commits, reviewed],
  )
  const progress = repository.commits.length ? (reviewedCount / repository.commits.length) * 100 : 0

  function toggleQuest(sha: string) {
    setReviewed((current) => {
      const next = new Set(current)
      if (next.has(sha)) next.delete(sha)
      else next.add(sha)
      saveReviewedCommits(repositoryKey, next)
      return next
    })
  }

  return (
    <section className="quest-board" id="quests" aria-labelledby="quest-title">
      <div className="quest-summary">
        <span className="section-index">CHRONICLE 01</span>
        <h2 id="quest-title">Commit Quest Board</h2>
        <p>Read the latest changes, follow their trail on GitHub, and mark each chapter as reviewed.</p>
        <div
          className="quest-progress"
          role="progressbar"
          aria-label="Commit quests reviewed"
          aria-valuemin={0}
          aria-valuemax={repository.commits.length}
          aria-valuenow={reviewedCount}
          aria-valuetext={`${reviewedCount} of ${repository.commits.length} commit quests reviewed`}
        >
          <div className="quest-progress-score"><strong>{reviewedCount}</strong><span>/ {repository.commits.length}</span></div>
          <div className="quest-progress-copy"><b>JOURNAL PROGRESS</b><span>{repository.commits.length - reviewedCount} quests remaining</span></div>
          <div className="quest-progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>
        <small className="quest-save-note"><i /> Progress is saved on this device</small>
      </div>

      <div className="quest-list">
        {repository.commits.length === 0 && (
          <div className="quest-empty"><span>?</span><b>No commit trail found</b><p>This repository did not return public commit history.</p></div>
        )}
        {repository.commits.map((commit, index) => {
          const complete = reviewed.has(commit.sha)
          return (
            <article className={`commit-quest${complete ? ' complete' : ''}`} key={commit.sha}>
              <button
                className="quest-check"
                type="button"
                aria-pressed={complete}
                aria-label={`${complete ? 'Mark unread' : 'Mark reviewed'}: ${commit.message}`}
                onClick={() => toggleQuest(commit.sha)}
              >{complete ? '✓' : String(index + 1).padStart(2, '0')}</button>
              <div className="quest-copy">
                <div className="quest-meta"><span>{commit.sha.slice(0, 7)}</span><i />{formatQuestDate(commit.date)}</div>
                <h3>{commit.message}</h3>
                <p>BY {commit.author}</p>
              </div>
              <a href={commit.url} target="_blank" rel="noreferrer" aria-label={`Open commit ${commit.sha.slice(0, 7)} on GitHub`}>OPEN <span>↗</span></a>
            </article>
          )
        })}
      </div>
    </section>
  )
}
