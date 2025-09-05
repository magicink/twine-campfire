import { describe, it, expect, afterEach } from 'bun:test'
import {
  extractQuoted,
  getBaseUrl,
  mergeClasses,
  parseDisabledAttr
} from '@campfire/utils/core'

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

describe('mergeClasses', () => {
  it('combines strings and arrays', () => {
    expect(mergeClasses('a', ['b', 'c'], 'd')).toBe('a b c d')
  })

  it('deduplicates and filters falsy values', () => {
    expect(mergeClasses('a', undefined, 'a', ['b', '', 'c'], false)).toBe(
      'a b c'
    )
  })
})

describe('getBaseUrl', () => {
  const originalWindow = (globalThis as { window?: unknown }).window
  const originalDocument = (globalThis as { document?: unknown }).document

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      ;(globalThis as { window?: unknown }).window = originalWindow
    }
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document
    } else {
      ;(globalThis as { document?: unknown }).document = originalDocument
    }
  })

  it('prefers window.location.origin', () => {
    ;(globalThis as { window?: unknown }).window = {
      location: { origin: 'https://example.com' }
    }
    ;(globalThis as { document?: unknown }).document = {
      baseURI: 'https://other.test/'
    }
    expect(getBaseUrl()).toBe('https://example.com')
  })

  it('falls back to document.baseURI', () => {
    delete (globalThis as { window?: unknown }).window
    ;(globalThis as { document?: unknown }).document = {
      baseURI: 'https://docs.example/'
    }
    expect(getBaseUrl()).toBe('https://docs.example/')
  })

  it('defaults to localhost', () => {
    delete (globalThis as { window?: unknown }).window
    delete (globalThis as { document?: unknown }).document
    expect(getBaseUrl()).toBe('http://localhost')
  })
})

describe('parseDisabledAttr', () => {
  it('handles boolean values', () => {
    expect(parseDisabledAttr(true)).toBe(true)
    expect(parseDisabledAttr(false)).toBe(false)
  })

  it('handles truthy and falsey strings', () => {
    expect(parseDisabledAttr('')).toBe(true)
    expect(parseDisabledAttr('true')).toBe(true)
    expect(parseDisabledAttr('false')).toBe(false)
  })

  it('evaluates expressions against scope', () => {
    expect(parseDisabledAttr('count > 0', { count: 1 })).toBe(true)
    expect(parseDisabledAttr('count > 0', { count: 0 })).toBe(false)
  })
})
