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
}
