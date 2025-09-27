import { describe, it, expect } from 'bun:test'
import { normalizeDirectiveIndentation } from '@campfire/utils/normalizeDirectiveIndentation'

describe('normalizeDirectiveIndentation', () => {
  it('strips tabs and four spaces before directives', () => {
    const input = '\t:tab\n    :spaces\n  :keep\n:root'
    const output = normalizeDirectiveIndentation(input)
    expect(output).toBe(':tab\n:spaces\n  :keep\n:root')
  })

  it('keeps short or mixed indentation', () => {
    const input = '   :three\n \t:mix'
    const output = normalizeDirectiveIndentation(input)
    expect(output).toBe('   :three\n \t:mix')
  })

  it('restores container boundaries removed by Twine whitespace trimming', () => {
    const input = '::::::wrapper{className="test"}'
    const output = normalizeDirectiveIndentation(input)
    expect(output).toBe(':::\n:::wrapper{className="test"}')
  })
})
