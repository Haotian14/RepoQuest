import { FormEvent, useMemo, useState } from 'react'
import { Inspector } from './components/Inspector'
import { WorldMap } from './components/WorldMap'
import { demoRepository } from './demo'
import { fetchRepository } from './lib/github'
import { buildDistricts } from './lib/map'
import type { District, Repository } from './types'

function App() {
  const [query, setQuery] = useState('')
  const [repository, setRepository] = useState<Repository>(demoRepository)
  const [selected, setSelected] = useState<District>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const districts = useMemo(() => buildDistricts(repository), [repository])

  async function explore(event: FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSelected(undefined)
    try {
      setRepository(await fetchRepository(query))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The expedition failed.')
    } finally {
      setLoading(false)
    }
  }

  function selectDistrict(district: District) {
    setSelected(district)
    if (window.matchMedia('(max-width: 850px)').matches) {
      window.requestAnimationFrame(() => {
        const inspector = document.querySelector<HTMLElement>('.inspector')
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        inspector?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
        inspector?.focus({ preventScroll: true })
      })
    }
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
          <a className="github-link" href="https://github.com/Haotian14/RepoQuest" target="_blank" rel="noreferrer">GITHUB <span>↗</span></a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A GITHUB ADVENTURE</p>
          <h1>Explore code.<br /><em>Find the story.</em></h1>
          <p className="subtitle">Every repository is a place waiting to be discovered. Turn folders into villages, files into landmarks, and code into a living world.</p>
          <form onSubmit={explore} className="repo-form">
            <label htmlFor="repository">Choose a public repository</label>
            <div className="input-row">
              <span aria-hidden="true">GH</span>
              <input
                id="repository"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="owner/repository"
                autoComplete="off"
              />
              <button disabled={loading}>{loading ? 'BUILDING WORLD…' : 'BEGIN QUEST'}</button>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <p className="form-note"><i /> No sign-in &nbsp;·&nbsp; Public repositories only</p>
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
              <span className="repo-owner">{repository.owner} /</span>
              <h3>{repository.name}</h3>
              <p>{repository.description}</p>
            </div>
          </div>
          <div className="repo-metrics">
            <div><strong>{repository.stars.toLocaleString()}</strong><span>STARS</span></div>
            <div><strong>{repository.language}</strong><span>LANGUAGE</span></div>
            <div><strong>{repository.files.length}</strong><span>FILES</span></div>
            <div><strong>{districts.length}</strong><span>DISTRICTS</span></div>
          </div>
        </section>

        <section className="explorer-layout">
          <WorldMap districts={districts} selected={selected} onSelect={selectDistrict} />
          <Inspector district={selected} />
        </section>
      </section>

      <footer>
        <span>BUILT FOR CURIOUS DEVELOPERS</span>
        <span>RepoQuest · OPEN SOURCE</span>
      </footer>
    </main>
  )
}

export default App
