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

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RepoQuest home">
          <span className="brand-mark">RQ</span>
          <span>REPOQUEST</span>
        </a>
        <div className="top-actions">
          <span className="online-dot" /> PUBLIC REPOS
          <a href="https://github.com/Haotian14" target="_blank" rel="noreferrer">GITHUB ↗</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">A NEW WAY TO READ CODE</p>
          <h1>YOUR REPOSITORY<br /><em>IS A WORLD.</em></h1>
          <p className="subtitle">Paste a public GitHub repository. RepoQuest transforms its files and folders into an explorable pixel map.</p>
        </div>
        <form onSubmit={explore} className="repo-form">
          <label htmlFor="repository">ENTER A REPOSITORY</label>
          <div className="input-row">
            <span>⌘</span>
            <input
              id="repository"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="owner/repository"
              autoComplete="off"
            />
            <button disabled={loading}>{loading ? 'GENERATING…' : 'EXPLORE →'}</button>
          </div>
          {error && <p className="error" role="alert">⚠ {error}</p>}
          <p className="form-note">No login required · Public repositories only · GitHub rate limits apply</p>
        </form>
      </section>

      <section className="repo-banner">
        <div>
          <span className="repo-owner">{repository.owner} /</span>
          <h2>{repository.name}</h2>
          <p>{repository.description}</p>
        </div>
        <div className="repo-metrics">
          <div><strong>★ {repository.stars.toLocaleString()}</strong><span>STARS</span></div>
          <div><strong>{repository.language}</strong><span>LANGUAGE</span></div>
          <div><strong>{repository.files.length}</strong><span>FILES</span></div>
          <div><strong>{districts.length}</strong><span>DISTRICTS</span></div>
        </div>
      </section>

      <section className="explorer-layout">
        <WorldMap districts={districts} selected={selected} onSelect={setSelected} />
        <Inspector district={selected} />
      </section>

      <footer>
        <span>BUILT FOR CURIOUS DEVELOPERS</span>
        <span>RepoQuest v0.1 · MIT</span>
      </footer>
    </main>
  )
}

export default App
