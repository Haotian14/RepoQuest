import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BossArena } from './components/BossArena'
import { ChangeTracker } from './components/ChangeTracker'
import { Inspector } from './components/Inspector'
import { QuestBoard } from './components/QuestBoard'
import { ShareMap } from './components/ShareMap'
import { WorldMap } from './components/WorldMap'
import { demoRepository } from './demo'
import { fetchRepository } from './lib/github'
import { buildDistricts } from './lib/map'
import { clearRecentRepositories, loadRecentRepositories, recentRepositoryLabel, rememberRepository } from './lib/recent'
import { compareRepositorySnapshot, loadRepositorySnapshot, saveExplorationLocation, saveRepositorySnapshot, type RepositoryChangeReport } from './lib/snapshot'
import type { District, Repository } from './types'

type HistoryMode = 'push' | 'replace' | 'none'

function App() {
  const [query, setQuery] = useState('')
  const [repository, setRepository] = useState<Repository>(demoRepository)
  const [selected, setSelected] = useState<District>()
  const [mapPath, setMapPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(true)
  const [recentRepositories, setRecentRepositories] = useState(loadRecentRepositories)
  const [changeReport, setChangeReport] = useState<RepositoryChangeReport>()
  const activeRequest = useRef<AbortController | undefined>(undefined)
  const requestSequence = useRef(0)
  const districts = useMemo(() => buildDistricts(repository, mapPath), [repository, mapPath])
  const rootDistricts = useMemo(() => buildDistricts(repository), [repository])

  const openRepository = useCallback(async (value: string, historyMode: HistoryMode = 'push') => {
    const requestedRepository = value.trim()
    if (!requestedRepository) return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const sequence = ++requestSequence.current
    setLoading(true)
    setError('')
    setSelected(undefined)
    setMapPath('')
    setChangeReport(undefined)

    try {
      const nextRepository = await fetchRepository(requestedRepository, controller.signal)
      if (controller.signal.aborted || sequence !== requestSequence.current) return

      const fullName = `${nextRepository.owner}/${nextRepository.name}`
      const previousSnapshot = loadRepositorySnapshot(nextRepository)
      const nextChangeReport = compareRepositorySnapshot(nextRepository, previousSnapshot)
      saveRepositorySnapshot(nextRepository)
      setRepository(nextRepository)
      setChangeReport(nextChangeReport)
      setIsDemo(false)
      setQuery(fullName)
      setRecentRepositories(rememberRepository(nextRepository))

      if (historyMode !== 'none') {
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('repo', fullName)
        window.history[historyMode === 'push' ? 'pushState' : 'replaceState']({}, '', nextUrl)
      }
    } catch (reason) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return
      setError(reason instanceof Error ? reason.message : 'The expedition failed.')
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    function openFromLocation() {
      const requestedRepository = new URL(window.location.href).searchParams.get('repo')?.trim()
      if (requestedRepository) {
        setQuery(requestedRepository)
        void openRepository(requestedRepository, 'replace')
        return
      }

      activeRequest.current?.abort()
      requestSequence.current += 1
      setRepository(demoRepository)
      setIsDemo(true)
      setSelected(undefined)
      setMapPath('')
      setQuery('')
      setError('')
      setLoading(false)
      setChangeReport(undefined)
    }

    openFromLocation()
    window.addEventListener('popstate', openFromLocation)
    return () => {
      window.removeEventListener('popstate', openFromLocation)
      activeRequest.current?.abort()
      requestSequence.current += 1
    }
  }, [openRepository])

  function explore(event: FormEvent) {
    event.preventDefault()
    void openRepository(query)
  }

  function selectDistrict(district: District) {
    if (district.canEnter) {
      setMapPath(district.path)
      setSelected(undefined)
      if (!isDemo) saveExplorationLocation(repository, { mapPath: district.path })
      return
    }
    setSelected(district)
    if (!isDemo) saveExplorationLocation(repository, { mapPath, selectedPath: district.path, selectedKind: district.kind })
    if (window.matchMedia('(max-width: 850px)').matches) {
      window.requestAnimationFrame(() => {
        const inspector = document.querySelector<HTMLElement>('.inspector')
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        inspector?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
        inspector?.focus({ preventScroll: true })
      })
    }
  }

  function navigateMap(path: string) {
    setMapPath(path)
    setSelected(undefined)
    if (!isDemo) saveExplorationLocation(repository, { mapPath: path })
  }

  function resumeExploration() {
    const location = changeReport?.previousExploration
    if (!location) return
    const pathExists = !location.mapPath || repository.files.some((file) => file.path.startsWith(`${location.mapPath}/`))
    const nextPath = pathExists ? location.mapPath : ''
    const visibleDistricts = buildDistricts(repository, nextPath)
    const nextSelected = visibleDistricts.find((district) => (
      district.path === location.selectedPath && district.kind === location.selectedKind
    ))
    setMapPath(nextPath)
    setSelected(nextSelected)
    saveExplorationLocation(repository, {
      mapPath: nextPath,
      selectedPath: nextSelected?.path,
      selectedKind: nextSelected?.kind,
    })
    window.requestAnimationFrame(() => document.getElementById('repository-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RepoQuest home">
          <span className="brand-mark"><i />RQ</span>
          <span>RepoQuest<small>CODE VALLEY</small></span>
        </a>
        <div className="top-actions">
          <a className="world-link" href="#world">ENTER THE VALLEY</a>
          <a className="quest-link" href="#quests">QUEST LOG</a>
          <a className="arena-link" href="#arena">BOSS ARENA</a>
          <a className="github-link" href="https://github.com/Haotian14/RepoQuest" target="_blank" rel="noreferrer">GITHUB <span>↗</span></a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A GITHUB ADVENTURE</p>
          <h1>Explore code.<br /><em>Find the story.</em></h1>
          <p className="subtitle">Every repository is a place waiting to be discovered. Turn folders into villages, files into landmarks, and code into a living world.</p>
          <form onSubmit={explore} className="repo-form" aria-busy={loading}>
            <label htmlFor="repository">Choose a public repository</label>
            <div className="input-row">
              <span aria-hidden="true">GH</span>
              <input
                id="repository"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="owner/repository"
                autoComplete="off"
                disabled={loading}
              />
              <button disabled={loading}>{loading ? 'BUILDING WORLD…' : 'BEGIN QUEST'}</button>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <p className="form-note"><i /> No sign-in &nbsp;·&nbsp; Public repositories only</p>
            {recentRepositories.length > 0 && (
              <nav className="recent-repositories" aria-label="Recent repositories">
                <span>RECENT EXPEDITIONS</span>
                <div>
                  {recentRepositories.slice(0, 3).map((recent) => {
                    const label = recentRepositoryLabel(recent)
                    return (
                      <button
                        key={label.toLowerCase()}
                        type="button"
                        disabled={loading}
                        onClick={() => void openRepository(label)}
                      >{label}</button>
                    )
                  })}
                  <button
                    className="clear-recent"
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      clearRecentRepositories()
                      setRecentRepositories([])
                    }}
                  >CLEAR</button>
                </div>
              </nav>
            )}
          </form>
        </div>
        <div className="hero-status" aria-hidden="true">
          <span>01</span>
          <div><b>CODE VALLEY</b><small>WORLD ONLINE</small></div>
        </div>
        <a className="scroll-cue" href="#world"><span>EXPLORE THE MAP</span><i /></a>
      </section>

      <section className="world-section" id="world">
        <div className="section-heading">
          <div>
            <span className="section-index">WORLD 01</span>
            <h2>The Repository Valley</h2>
          </div>
          <p>Walk the paths, approach a district, and open its doors.</p>
        </div>

        <section className="repo-banner">
          <div className="repo-identity">
            <span className="repo-seal">RQ</span>
            <div>
              <span className={`repo-mode${isDemo ? ' demo' : ''}`}>{isDemo ? 'DEMO WORLD' : 'LIVE REPOSITORY'}</span>
              <span className="repo-owner">{repository.owner} /</span>
              <h3>{repository.name}</h3>
              <p>{repository.description}</p>
            </div>
          </div>
          <div className="repo-metrics">
            <div><strong>{repository.stars.toLocaleString()}</strong><span>STARS</span></div>
            <div><strong>{repository.language}</strong><span>LANGUAGE</span></div>
            <div><strong>{repository.files.length}</strong><span>FILES</span></div>
            <div><strong>{rootDistricts.length}</strong><span>DISTRICTS</span></div>
          </div>
        </section>

        {repository.warnings.length > 0 && (
          <aside className="repository-warnings" role="status" aria-label="Repository data warnings">
            <strong>PARTIAL EXPEDITION DATA</strong>
            <ul>{repository.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </aside>
        )}

        {!isDemo && changeReport && <ChangeTracker report={changeReport} onResume={resumeExploration} />}

        {repository.files.length === 0 ? (
          <section className="empty-world" aria-label="Empty repository world" aria-busy={loading}>
            {loading && (
              <div className="world-loading" role="status" aria-live="polite">
                <span className="loading-rune" aria-hidden="true">RQ</span>
                <div><strong>REBUILDING THE VALLEY</strong><small>{query || 'Preparing repository data…'}</small></div>
              </div>
            )}
            <div className="empty-world-scene" aria-hidden="true">
              <div className="empty-world-ground">
                <span className="empty-world-tent">⛺</span>
                <span className="empty-world-tree">🌲</span>
                <span className="empty-world-rock">🪨</span>
              </div>
              <div className="empty-world-badge">UNSETTLED TERRITORY</div>
            </div>
            <div className="empty-world-content">
              <span className="empty-world-tag">QUIET VALLEY</span>
              <h3>No structures have been built yet</h3>
              <p>
                This repository has no files on its <strong>{repository.defaultBranch}</strong> branch yet. Once code or documents are committed, districts, trails, and landmarks will emerge across the valley.
              </p>
              <div className="empty-world-actions">
                <a
                  className="empty-world-action"
                  href={`https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on GitHub <span>↗</span>
                </a>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="explorer-layout" aria-busy={loading}>
              {loading && (
                <div className="world-loading" role="status" aria-live="polite">
                  <span className="loading-rune" aria-hidden="true">RQ</span>
                  <div><strong>REBUILDING THE VALLEY</strong><small>{query || 'Preparing repository data…'}</small></div>
                </div>
              )}
              <WorldMap
                districts={districts}
                selected={selected}
                recentChangedPaths={repository.recentChangedPaths}
                currentPath={mapPath}
                language={repository.language}
                onSelect={selectDistrict}
                onNavigate={navigateMap}
              />
              <Inspector district={selected} repository={repository} />
            </section>

            <ShareMap repository={repository} districts={rootDistricts} />
          </>
        )}

        <QuestBoard repository={repository} />
        <BossArena repository={repository} />
      </section>

      <footer>
        <span>BUILT FOR CURIOUS DEVELOPERS</span>
        <span>RepoQuest · OPEN SOURCE</span>
      </footer>
    </main>
  )
}

export default App
