import type { RepositoryChangeReport } from '../lib/snapshot'

type Props = {
  report: RepositoryChangeReport
  onResume: () => void
}

export function ChangeTracker({ report, onResume }: Props) {
  if (!report.hasPreviousVisit) {
    return (
      <aside className="change-tracker first-visit" role="status">
        <div className="change-tracker-icon" aria-hidden="true">◎</div>
        <div><span>EXPEDITION SNAPSHOT SAVED</span><p>Come back later and RepoQuest will reveal which districts changed.</p></div>
      </aside>
    )
  }

  const changedFileCount = report.addedFiles.length + report.removedFiles.length + report.modifiedFiles.length
  const hasResumePoint = Boolean(report.previousExploration?.mapPath || report.previousExploration?.selectedPath)
  const visitLabel = report.previousVisit
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.previousVisit))
    : 'your last expedition'

  return (
    <aside className="change-tracker" aria-label="Changes since your last visit">
      <div className="change-tracker-heading">
        <div><span>WORLD DELTA</span><h3>Since your last expedition</h3><small>Compared with {visitLabel}</small></div>
        {hasResumePoint && <button type="button" onClick={onResume}>CONTINUE LAST EXPLORATION →</button>}
      </div>
      <div className="change-metrics">
        <div><strong>+{report.addedFiles.length}</strong><span>FILES ADDED</span></div>
        <div><strong>{report.modifiedFiles.length}</strong><span>FILES MODIFIED</span></div>
        <div><strong>−{report.removedFiles.length}</strong><span>FILES REMOVED</span></div>
        <div><strong>{report.newCommits.length}</strong><span>NEW COMMITS</span></div>
        <div><strong>{report.newIssues.length}</strong><span>NEW ISSUES</span></div>
        <div><strong>{report.newPullRequests.length}</strong><span>NEW PULL REQUESTS</span></div>
      </div>
      <div className="change-regions">
        <span>{changedFileCount ? 'CHANGED DISTRICTS' : 'THE WORLD IS QUIET'}</span>
        {changedFileCount ? report.changedAreas.slice(0, 6).map((area) => (
          <b key={area.path}>{area.path} <i>{area.count}</i></b>
        )) : <p>No file-level changes were detected since the saved snapshot.</p>}
      </div>
    </aside>
  )
}
