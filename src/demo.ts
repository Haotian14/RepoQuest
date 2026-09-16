import type { Repository } from './types'

const demoPaths = [
  ['src/components/Map.tsx', 6200], ['src/components/Building.tsx', 4100],
  ['src/components/Inspector.tsx', 3500], ['src/lib/github.ts', 2800],
  ['src/lib/map.ts', 3100], ['src/App.tsx', 7200], ['src/styles.css', 9800],
  ['public/hero.png', 24000], ['public/favicon.svg', 1800],
  ['tests/map.test.ts', 2300], ['tests/github.test.ts', 1900],
  ['docs/vision.md', 4400], ['docs/contributing.md', 2100],
  ['package.json', 1100], ['README.md', 5600], ['vite.config.ts', 600],
] as const

export const demoRepository: Repository = {
  owner: 'Haotian14',
  name: 'RepoQuest',
  description: 'Turn any GitHub repository into an explorable pixel world.',
  stars: 128,
  language: 'TypeScript',
  defaultBranch: 'main',
  files: demoPaths.map(([path, size]) => ({ path, size, type: 'blob' })),
  commits: [
    { sha: 'ae386be6c92bbbbcee8c2674ccbf8707a3c0a379', message: 'feat: fade buildings when explorer walks behind', author: 'Haotian14', date: '2026-09-16T08:25:00Z', url: 'https://github.com/Haotian14/RepoQuest/commit/ae386be6c92bbbbcee8c2674ccbf8707a3c0a379' },
    { sha: '41b10b219e19c51180371c78e339c19c421b1c4a', message: 'fix: correct explorer facing and world occlusion', author: 'Haotian14', date: '2026-09-16T08:10:00Z', url: 'https://github.com/Haotian14/RepoQuest/commit/41b10b219e19c51180371c78e339c19c421b1c4a' },
    { sha: '50e77b84cad3593c9b8b18a7419996e8ed777fde', message: 'feat: deliver polished RepoQuest pixel world', author: 'Haotian14', date: '2026-09-16T07:49:00Z', url: 'https://github.com/Haotian14/RepoQuest/commit/50e77b84cad3593c9b8b18a7419996e8ed777fde' },
    { sha: '455b66c52b38fcf3d759f8af1aeebfd8f1a82935', message: 'feat: refine pixel world with CC0 art packs', author: 'Haotian14', date: '2026-09-16T06:00:00Z', url: 'https://github.com/Haotian14/RepoQuest/commit/455b66c52b38fcf3d759f8af1aeebfd8f1a82935' },
  ],
}
