import { describe, expect, it } from 'vitest'
import { changedLinesFromPatch, highlightSourceLine, isPreviewableSource, sourceLanguage } from './source'

describe('source preview helpers', () => {
  it('extracts added and replacement line numbers from a unified patch', () => {
    const patch = '@@ -2,3 +2,4 @@\n keep\n-old\n+new\n+extra\n end'
    expect(changedLinesFromPatch(patch)).toEqual([3, 4])
  })

  it('detects languages and rejects large or binary files', () => {
    expect(sourceLanguage('src/App.tsx')).toBe('typescript')
    expect(sourceLanguage('config/settings.yaml')).toBe('yaml')
    expect(isPreviewableSource({ path: 'src/App.tsx', size: 1200 })).toBe(true)
    expect(isPreviewableSource({ path: 'public/hero.png', size: 1200 })).toBe(false)
    expect(isPreviewableSource({ path: 'src/huge.ts', size: 400_000 })).toBe(false)
  })

  it('returns safe semantic tokens for lightweight highlighting', () => {
    expect(highlightSourceLine('const answer = 42 // result', 'typescript')).toEqual([
      { text: 'const', kind: 'keyword' },
      { text: ' ', kind: 'plain' },
      { text: 'answer', kind: 'plain' },
      { text: ' = ', kind: 'plain' },
      { text: '42', kind: 'number' },
      { text: ' ', kind: 'plain' },
      { text: '// result', kind: 'comment' },
    ])
  })
})
