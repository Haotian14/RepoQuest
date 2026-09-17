import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repository } from './types'
import App from './App'

const fetchRepository = vi.fn()

vi.mock('./lib/github', () => ({
  fetchRepository: (...args: unknown[]) => fetchRepository(...args),
}))

vi.mock('./components/WorldMap', () => ({ WorldMap: () => <div data-testid="world-map" /> }))
vi.mock('./components/Inspector', () => ({ Inspector: () => <div data-testid="inspector" /> }))
vi.mock('./components/QuestBoard', () => ({ QuestBoard: () => null }))
vi.mock('./components/BossArena', () => ({ BossArena: () => null }))
vi.mock('./components/ShareMap', () => ({ ShareMap: () => null }))

function repository(owner: string, name: string): Repository {
  return {
    owner,
    name,
    description: `${name} description`,
    stars: 1,
    language: 'TypeScript',
    defaultBranch: 'main',
    files: [],
    commits: [],
    bosses: [],
    warnings: [],
    recentChangedPaths: [],
    recentFileChanges: {},
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return { promise, resolve }
}

describe('App repository exploration', () => {
  beforeEach(() => {
    fetchRepository.mockReset()
    localStorage.clear()
    window.history.replaceState({}, '', '/RepoQuest/')
  })

  it('automatically opens a repository from the repo query parameter', async () => {
    fetchRepository.mockResolvedValue(repository('openai', 'codex'))
    window.history.replaceState({}, '', '/RepoQuest/?repo=openai%2Fcodex')

    render(<App />)

    await waitFor(() => expect(fetchRepository).toHaveBeenCalledWith('openai/codex', expect.any(AbortSignal)))
    expect(await screen.findByRole('heading', { name: 'codex', level: 3 })).not.toBeNull()
    expect(new URL(window.location.href).searchParams.get('repo')).toBe('openai/codex')
  })

  it('keeps the newest result when an older request finishes last', async () => {
    const first = deferred<Repository>()
    const second = deferred<Repository>()
    fetchRepository
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    render(<App />)
    const input = screen.getByLabelText('Choose a public repository')
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: 'old/repository' } })
    fireEvent.submit(form)
    fireEvent.change(input, { target: { value: 'new/repository' } })
    fireEvent.submit(form)

    second.resolve(repository('new', 'repository'))
    expect(await screen.findByText('new /')).not.toBeNull()

    first.resolve(repository('old', 'repository'))
    await waitFor(() => expect(screen.queryByText('old /')).toBeNull())
    expect(new URL(window.location.href).searchParams.get('repo')).toBe('new/repository')
  })

  it('renders a friendly empty-world state with working GitHub link when repository has no files', async () => {
    fetchRepository.mockResolvedValue(repository('octocat', 'empty-repo'))
    window.history.replaceState({}, '', '/RepoQuest/?repo=octocat%2Fempty-repo')

    render(<App />)

    expect(await screen.findByRole('region', { name: 'Empty repository world' })).not.toBeNull()
    expect(screen.getByText(/No structures have been built yet/i)).not.toBeNull()
    expect(screen.getByText(/This repository has no files on its/i)).not.toBeNull()
    const githubLink = screen.getByRole('link', { name: /Open on GitHub/i })
    expect(githubLink.getAttribute('href')).toBe('https://github.com/octocat/empty-repo')
    expect(screen.queryByTestId('world-map')).toBeNull()
  })

  it('renders the interactive world map when repository has files', async () => {
    const populated = repository('octocat', 'hello-world')
    populated.files = [{ path: 'src/main.ts', size: 120, type: 'blob' }]
    fetchRepository.mockResolvedValue(populated)
    window.history.replaceState({}, '', '/RepoQuest/?repo=octocat%2Fhello-world')

    render(<App />)

    expect(await screen.findByTestId('world-map')).not.toBeNull()
    expect(screen.queryByRole('region', { name: 'Empty repository world' })).toBeNull()
  })
})
