import { describe, it, expect } from 'bun:test'
import { extractQuoted } from '@campfire/utils/core'

describe('extractQuoted', () => {
  it('unwraps single-quoted strings', () => {
    expect(extractQuoted("'hello'")).toBe('hello')
  })

  it('unwraps double-quoted strings', () => {
    expect(extractQuoted('"hello"')).toBe('hello')
  })

  it('unwraps back-quoted strings', () => {
    expect(extractQuoted('`hello`')).toBe('hello')
  })

  it('handles nested quotes', () => {
    expect(extractQuoted('\'He said "hi"\'')).toBe('He said "hi"')
    expect(extractQuoted('"It\'s fine"')).toBe("It's fine")
    expect(extractQuoted('`mix "and" \'match\'`')).toBe('mix "and" \'match\'')
  })
})
