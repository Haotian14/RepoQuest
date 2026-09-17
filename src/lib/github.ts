import type { BossEncounter, CommitQuest, RecentFileChange, RepoFile, Repository } from '../types'
import { changedLinesFromPatch } from './source'

const GITHUB_REPO = /^([a-z0-9_.-]+)\/([a-z0-9_.-]+?)(?:\.git)?\/?$/i

export function parseRepository(value: string) {
  const input = value.trim()
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input)
      const [owner, rawName] = url.pathname.split('/').filter(Boolean)
      const name = rawName?.replace(/\.git$/i, '')
      if (url.hostname.toLowerCase() === 'github.com' && owner && name && GITHUB_REPO.test(`${owner}/${name}`)) {
        return { owner: decodeURIComponent(owner), name: decodeURIComponent(name) }
      }
    } catch {
      // Fall through to the shared validation error.
    }
    throw new Error('Use a GitHub URL or owner/repository.')
  }

  const match = input.match(GITHUB_REPO)
  if (!match) throw new Error('Use a GitHub URL or owner/repository.')
  return { owner: match[1], name: match[2] }
}

type GitHubCommit = {
  sha: string
  html_url: string
  author?: { login?: string; avatar_url?: string } | null
  commit: {
    message: string
    author?: { name?: string; date?: string } | null
  }
}

export function normalizeCommits(commits: GitHubCommit[]): CommitQuest[] {
  return commits.map((item) => ({
    sha: item.sha,
    message: item.commit.message.split('\n')[0] || 'Untitled commit',
    author: item.author?.login || item.commit.author?.name || 'Unknown explorer',
    avatarUrl: item.author?.avatar_url,
    date: item.commit.author?.date || new Date(0).toISOString(),
    url: item.html_url,
  }))
}

type GitHubIssue = {
  number: number
  title: string
  html_url: string
  comments?: number
  updated_at?: string
  user?: { login?: string; avatar_url?: string } | null
  labels?: Array<string | { name?: string }>
  pull_request?: unknown
}

type GitHubMetadata = {
  default_branch?: string | null
  description?: string | null
  stargazers_count?: number
  language?: string | null
}

type GitHubTree = {
  tree?: Array<{ path?: string; size?: number; type?: string }>
  truncated?: boolean
}

type GitHubCommitDetail = {
  files?: Array<{
    filename?: string
    status?: string
    additions?: number
    deletions?: number
    patch?: string
  }>
}

const FILE_LIMIT = 3000

export function normalizeBosses(items: GitHubIssue[]): BossEncounter[] {
  return items.map((item) => {
    const kind = item.pull_request ? 'pull_request' : 'issue'
    return {
      id: `${kind}-${item.number}`,
      number: item.number,
      kind,
      title: item.title || 'Untitled encounter',
      author: item.user?.login || 'Unknown challenger',
      avatarUrl: item.user?.avatar_url,
      updatedAt: item.updated_at || new Date(0).toISOString(),
      comments: item.comments || 0,
      labels: (item.labels || []).map((label) => typeof label === 'string' ? label : label.name).filter((label): label is string => Boolean(label)),
      url: item.html_url,
    }
  })
}

export async function fetchRepository(value: string, signal?: AbortSignal): Promise<Repository> {
  const { owner, name } = parseRepository(value)
  const headers = { Accept: 'application/vnd.github+json' }
  const request = { headers, signal }
  const repositoryUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`

  const metadataResponse = await fetch(repositoryUrl, request)
  if (!metadataResponse.ok) {
    if (metadataResponse.status === 404) throw new Error('Repository not found or not public.')
    if (metadataResponse.status === 403) throw new Error('GitHub rate limit reached. Try again later.')
    throw new Error('Could not load this repository.')
  }

  const metadata = await metadataResponse.json() as GitHubMetadata
  const warnings: string[] = []

  async function optionalFetch(url: string) {
    try {
      return await fetch(url, request)
    } catch (error) {
      if (signal?.aborted) throw error
      return undefined
    }
  }

  const defaultBranch = metadata.default_branch?.trim() || 'main'
  const issuesUrl = `${repositoryUrl}/issues?state=open&sort=comments&direction=desc&per_page=9`

  if (!metadata.default_branch?.trim()) {
    warnings.push('This repository has no files yet.')
    const issuesResponse = await optionalFetch(issuesUrl)
    const bosses = issuesResponse?.ok
      ? normalizeBosses(await issuesResponse.json() as GitHubIssue[])
      : []
    if (!issuesResponse?.ok) warnings.push('Open issues and pull requests could not be loaded.')
    return {
      owner,
      name,
      description: metadata.description ?? 'An unexplored repository.',
      stars: metadata.stargazers_count ?? 0,
      language: metadata.language ?? 'Mixed',
      defaultBranch,
      files: [],
      commits: [],
      bosses,
      warnings,
      recentChangedPaths: [],
      recentFileChanges: {},
    }
  }

  const branch = encodeURIComponent(defaultBranch)
  const [treeResponse, commitsResponse, issuesResponse] = await Promise.all([
    fetch(`${repositoryUrl}/git/trees/${branch}?recursive=1`, request),
    optionalFetch(`${repositoryUrl}/commits?sha=${branch}&per_page=10`),
    optionalFetch(issuesUrl),
  ])

  let tree: GitHubTree = { tree: [] }
  if (treeResponse.ok) {
    tree = await treeResponse.json() as GitHubTree
  } else if (treeResponse.status === 409) {
    warnings.push('This repository has no files yet.')
  } else if (treeResponse.status === 403) {
    throw new Error('GitHub rate limit reached while loading the repository tree. Try again later.')
  } else {
    throw new Error('Could not load the repository tree.')
  }

  if (tree.truncated) {
    warnings.push('GitHub returned a truncated repository tree; some files may be missing.')
  }

  const blobs = (tree.tree ?? []).filter((item) => item.type === 'blob' && typeof item.path === 'string')
  if (blobs.length > FILE_LIMIT) {
    warnings.push(`Only the first ${FILE_LIMIT.toLocaleString('en-US')} files are shown; additional files were omitted.`)
  }

  const files: RepoFile[] = blobs
    .slice(0, FILE_LIMIT)
    .map((item) => ({ path: item.path!, size: typeof item.size === 'number' ? item.size : 0, type: 'blob' }))

  let commits: CommitQuest[] = []
  if (commitsResponse?.ok) {
    commits = normalizeCommits(await commitsResponse.json() as GitHubCommit[])
  } else if (treeResponse.status !== 409) {
    warnings.push('Recent commits could not be loaded.')
  }

  let bosses: BossEncounter[] = []
  if (issuesResponse?.ok) {
    bosses = normalizeBosses(await issuesResponse.json() as GitHubIssue[])
  } else {
    warnings.push('Open issues and pull requests could not be loaded.')
  }

  let recentChangedPaths: string[] = []
  let recentFileChanges: Record<string, RecentFileChange> = {}
  if (commits.length > 0) {
    const detailResponse = await optionalFetch(`${repositoryUrl}/commits/${encodeURIComponent(commits[0].sha)}?per_page=100`)
    if (detailResponse?.ok) {
      const detail = await detailResponse.json() as GitHubCommitDetail
      const changedFiles = (detail.files ?? []).filter(
        (file): file is typeof file & { filename: string } => typeof file.filename === 'string',
      )
      recentChangedPaths = changedFiles.map((file) => file.filename)
      recentFileChanges = Object.fromEntries(changedFiles.map((file) => [file.filename, {
        path: file.filename,
        status: file.status ?? 'modified',
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        changedLines: changedLinesFromPatch(file.patch),
      }]))
      if (detailResponse.headers.get('link')?.includes('rel="next"')) {
        warnings.push('The latest commit changes more than 100 files; map highlights show a partial list.')
      }
    } else {
      warnings.push('Changed files for the latest commit could not be loaded.')
    }
  }

  return {
    owner,
    name,
    description: metadata.description ?? 'An unexplored repository.',
    stars: metadata.stargazers_count ?? 0,
    language: metadata.language ?? 'Mixed',
    defaultBranch,
    files,
    commits,
    bosses,
    warnings,
    recentChangedPaths,
    recentFileChanges,
  }
}
