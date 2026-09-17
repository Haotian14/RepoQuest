import { describe, expect, it } from 'vitest'
import { demoRepository } from '../demo'
import { analyzeRepositorySources, selectAnalysisFiles } from './analysis'

describe('repository static analysis', () => {
  it('prioritizes manifests, documentation, configuration, entries, and tests', () => {
    const paths = selectAnalysisFiles(demoRepository).map((file) => file.path)
    expect(paths.slice(0, 2)).toEqual(['README.md', 'package.json'])
    expect(paths).toContain('src/App.tsx')
    expect(paths.some((path) => /test/i.test(path))).toBe(true)
  })

  it('derives stack, commands, entries, imports, and test candidates without AI', () => {
    const analysis = analyzeRepositorySources(demoRepository, {
      'package.json': JSON.stringify({
        scripts: { dev: 'vite', build: 'tsc -b && vite build' },
        dependencies: { react: '^19.0.0' },
        devDependencies: { typescript: '^7.0.0', vite: '^8.0.0', vitest: '^5.0.0' },
      }),
      'src/App.tsx': "import { WorldMap } from './components/WorldMap'\nexport default function App() {}",
      'tests/map.test.ts': "import { buildDistricts } from '../src/lib/map'",
    })

    expect(analysis.techStack).toEqual(['TypeScript', 'React', 'Vite', 'Vitest'])
    expect(analysis.startCommands[0]).toBe('npm run dev — vite')
    expect(analysis.entryPoints).toContain('src/App.tsx')
    expect(analysis.coreModules).toContain('./components/WorldMap')
    expect(analysis.testEntries).toContain('tests/map.test.ts')
  })
})
