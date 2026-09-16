import type { BossEncounter, CommitQuest, RepoFile, Repository } from '../types'

const GITHUB_REPO = /^(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/#\s]+?)(?:\.git)?\/?$/i

export function parseRepository(value: string) {
  const match = value.trim().match(GITHUB_REPO)
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

export async function fetchRepository(value: string): Promise<Repository> {
  const { owner, name } = parseRepository(value)
  const headers = { Accept: 'application/vnd.github+json' }

  const metadataResponse = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers })
  if (!metadataResponse.ok) {
    if (metadataResponse.status === 404) throw new Error('Repository not found or not public.')
    if (metadataResponse.status === 403) throw new Error('GitHub rate limit reached. Try again later.')
    throw new Error('Could not load this repository.')
  }

  const metadata = await metadataResponse.json()
  const [treeResponse, commitsResponse, issuesResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}/git/trees/${metadata.default_branch}?recursive=1`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${name}/commits?sha=${metadata.default_branch}&per_page=10`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${name}/issues?state=open&sort=comments&direction=desc&per_page=9`, { headers }),
  ])
  if (!treeResponse.ok) throw new Error('Could not load the repository tree.')
  const tree = await treeResponse.json()
  const commits = commitsResponse.ok ? normalizeCommits(await commitsResponse.json()) : []
  const bosses = issuesResponse.ok ? normalizeBosses(await issuesResponse.json()) : []
  const files: RepoFile[] = tree.tree
    .filter((item: RepoFile) => item.type === 'blob')
    .slice(0, 3000)
    .map((item: RepoFile) => ({ path: item.path, size: item.size ?? 0, type: 'blob' }))

  return {
    owner,
    name,
    description: metadata.description ?? 'An unexplored repository.',
    stars: metadata.stargazers_count ?? 0,
    language: metadata.language ?? 'Mixed',
    defaultBranch: metadata.default_branch,
    files,
    commits,
    bosses,
  }
}
