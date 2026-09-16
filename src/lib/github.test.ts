import { describe, expect, it } from 'vitest'
import { parseRepository } from './github'

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

  it('rejects invalid values', () => {
    expect(() => parseRepository('not-a-repository')).toThrow('Use a GitHub URL')
  })
})
