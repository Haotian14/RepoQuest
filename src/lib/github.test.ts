import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRepository, normalizeBosses, normalizeCommits, parseRepository } from './github'

function response(body: unknown, status = 200, headers: HeadersInit = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function mockFetch(...responses: Response[]) {
  const mocked = vi.fn()
  responses.forEach((item) => mocked.mockResolvedValueOnce(item))
  vi.stubGlobal('fetch', mocked)
  return mocked
}

afterEach(() => vi.unstubAllGlobals())

describe('parseRepository', () => {
  it('parses shorthand repository names', () => {
    expect(parseRepository('Haotian14/RepoQuest')).toEqual({ owner: 'Haotian14', name: 'RepoQuest' })
  })

  it('parses GitHub URLs and strips .git', () => {
    expect(parseRepository('https://github.com/Haotian14/RepoQuest.git')).toEqual({
      owner: 'Haotian14',
      name: 'RepoQuest',
    })
  })

  it('ignores GitHub page query strings and subpaths', () => {
    expect(parseRepository('https://github.com/Haotian14/RepoQuest?tab=readme')).toEqual({
      owner: 'Haotian14',
      name: 'RepoQuest',
    })
    expect(parseRepository('https://github.com/Haotian14/RepoQuest/tree/main/src')).toEqual({
      owner: 'Haotian14',
      name: 'RepoQuest',
    })
  })

  it('rejects invalid values', () => {
    expect(() => parseRepository('not-a-repository')).toThrow('Use a GitHub URL')
  })
})

describe('normalizeCommits', () => {
  it('turns GitHub history into concise quests', () => {
    expect(normalizeCommits([{
      sha: 'abc123',
      html_url: 'https://github.com/example/repo/commit/abc123',
      author: { login: 'octocat', avatar_url: 'avatar.png' },
      commit: { message: 'feat: add map\n\nLong details', author: { name: 'Mona', date: '2026-09-16T00:00:00Z' } },
    }])).toEqual([{
      sha: 'abc123',
      message: 'feat: add map',
      author: 'octocat',
      avatarUrl: 'avatar.png',
      date: '2026-09-16T00:00:00Z',
      url: 'https://github.com/example/repo/commit/abc123',
    }])
  })
})

describe('normalizeBosses', () => {
  it('distinguishes issues from pull requests and keeps useful battle stats', () => {
    expect(normalizeBosses([{
      number: 42,
      title: 'Fix the dragon',
      html_url: 'https://github.com/example/repo/pull/42',
      comments: 7,
      updated_at: '2026-09-16T00:00:00Z',
      user: { login: 'octocat', avatar_url: 'avatar.png' },
      labels: [{ name: 'bug' }, 'urgent'],
      pull_request: {},
    }])[0]).toMatchObject({
      id: 'pull_request-42',
      kind: 'pull_request',
      author: 'octocat',
      comments: 7,
      labels: ['bug', 'urgent'],
    })
  })
})

describe('fetchRepository', () => {
  it('loads complete repository data, encodes URL segments, and forwards cancellation', async () => {
    const abortController = new AbortController()
    const mockedFetch = mockFetch(
      response({
        default_branch: 'feature/test',
        description: 'A repository',
        stargazers_count: 42,
        language: 'TypeScript',
      }),
      response({ tree: [{ path: 'src/main.ts', size: 120, type: 'blob' }], truncated: false }),
      response([{
        sha: 'abc/123',
        html_url: 'https://github.com/example/repo/commit/abc123',
        author: { login: 'octocat' },
        commit: { message: 'feat: begin', author: { date: '2026-09-16T00:00:00Z' } },
      }]),
      response([]),
      response({ files: [{ filename: 'src/main.ts' }, { filename: 'README.md' }, {}] }),
    )

    const repository = await fetchRepository('owner.team/repo.name', abortController.signal)

    expect(repository).toMatchObject({
      owner: 'owner.team',
      name: 'repo.name',
      defaultBranch: 'feature/test',
      warnings: [],
      recentChangedPaths: ['src/main.ts', 'README.md'],
    })
    expect(repository.files).toEqual([{ path: 'src/main.ts', size: 120, type: 'blob' }])
    expect(mockedFetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.github.com/repos/owner.team/repo.name',
      'https://api.github.com/repos/owner.team/repo.name/git/trees/feature%2Ftest?recursive=1',
      'https://api.github.com/repos/owner.team/repo.name/commits?sha=feature%2Ftest&per_page=10',
      'https://api.github.com/repos/owner.team/repo.name/issues?state=open&sort=comments&direction=desc&per_page=9',
      'https://api.github.com/repos/owner.team/repo.name/commits/abc%2F123?per_page=100',
    ])
    mockedFetch.mock.calls.forEach(([, init]) => expect(init.signal).toBe(abortController.signal))
  })

  it('reports truncated, capped, and partially unavailable data', async () => {
    const tree = Array.from({ length: 3001 }, (_, index) => ({
      path: `src/file-${index}.ts`,
      size: index,
      type: 'blob',
    }))
    mockFetch(
      response({ default_branch: 'main' }),
      response({ tree, truncated: true }),
      response({}, 503),
      response({}, 403),
    )

    const repository = await fetchRepository('example/large-repo')

    expect(repository.files).toHaveLength(3000)
    expect(repository.commits).toEqual([])
    expect(repository.bosses).toEqual([])
    expect(repository.recentChangedPaths).toEqual([])
    expect(repository.warnings).toEqual([
      'GitHub returned a truncated repository tree; some files may be missing.',
      'Only the first 3,000 files are shown; additional files were omitted.',
      'Recent commits could not be loaded.',
      'Open issues and pull requests could not be loaded.',
    ])
  })

  it('returns an explorable result for a repository without commits or files', async () => {
    mockFetch(
      response({ default_branch: 'main', description: null, language: null }),
      response({}, 409),
      response({}, 409),
      response([]),
    )

    await expect(fetchRepository('example/empty')).resolves.toMatchObject({
      files: [],
      commits: [],
      bosses: [],
      recentChangedPaths: [],
      warnings: ['This repository has no files yet.'],
    })
  })

  it('handles repositories whose default branch is not created yet', async () => {
    mockFetch(
      response({ default_branch: null, description: 'Fresh repository' }),
      response([]),
    )

    await expect(fetchRepository('example/fresh')).resolves.toMatchObject({
      defaultBranch: 'main',
      files: [],
      commits: [],
      warnings: ['This repository has no files yet.'],
    })
  })

  it('keeps the map when optional requests fail at the network layer', async () => {
    const mocked = vi.fn()
      .mockResolvedValueOnce(response({ default_branch: 'main' }))
      .mockResolvedValueOnce(response({ tree: [{ path: 'src/main.ts', type: 'blob', size: 12 }] }))
      .mockRejectedValueOnce(new TypeError('network failed'))
      .mockRejectedValueOnce(new TypeError('network failed'))
    vi.stubGlobal('fetch', mocked)

    const repository = await fetchRepository('example/repo')
    expect(repository.files).toHaveLength(1)
    expect(repository.warnings).toEqual([
      'Recent commits could not be loaded.',
      'Open issues and pull requests could not be loaded.',
    ])
  })

  it('keeps commit history when changed-file details are unavailable', async () => {
    mockFetch(
      response({ default_branch: 'main' }),
      response({ tree: [] }),
      response([{
        sha: 'abc123',
        html_url: 'https://github.com/example/repo/commit/abc123',
        commit: { message: 'Initial commit' },
      }]),
      response([]),
      response({}, 429),
    )

    const repository = await fetchRepository('example/repo')

    expect(repository.commits).toHaveLength(1)
    expect(repository.recentChangedPaths).toEqual([])
    expect(repository.warnings).toContain('Changed files for the latest commit could not be loaded.')
  })

  it('keeps repository data when changed-file details reject and reports pagination', async () => {
    const commit = {
      sha: 'abc123',
      html_url: 'https://github.com/example/repo/commit/abc123',
      commit: { message: 'Large change' },
    }
    const mocked = vi.fn()
      .mockResolvedValueOnce(response({ default_branch: 'main' }))
      .mockResolvedValueOnce(response({ tree: [] }))
      .mockResolvedValueOnce(response([commit]))
      .mockResolvedValueOnce(response([]))
      .mockRejectedValueOnce(new TypeError('network failed'))
    vi.stubGlobal('fetch', mocked)
    const unavailable = await fetchRepository('example/repo')
    expect(unavailable.commits).toHaveLength(1)
    expect(unavailable.warnings).toContain('Changed files for the latest commit could not be loaded.')

    mockFetch(
      response({ default_branch: 'main' }),
      response({ tree: [] }),
      response([commit]),
      response([]),
      response({ files: [{ filename: 'src/main.ts' }] }, 200, { link: '<next>; rel="next"' }),
    )
    const paginated = await fetchRepository('example/repo')
    expect(paginated.warnings).toContain('The latest commit changes more than 100 files; map highlights show a partial list.')
  })

  it('preserves useful errors for metadata and tree failures', async () => {
    mockFetch(response({}, 404))
    await expect(fetchRepository('example/missing')).rejects.toThrow('Repository not found or not public.')

    mockFetch(
      response({ default_branch: 'main' }),
      response({}, 500),
      response([]),
      response([]),
    )
    await expect(fetchRepository('example/broken')).rejects.toThrow('Could not load the repository tree.')
  })
})
