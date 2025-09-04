import { describe, it, expect } from 'bun:test'
import type { Paragraph, RootContent, Text as MdText } from 'mdast'
import type { Text as HastText } from 'hast'
import {
  isWhitespaceText,
  isWhitespaceRootContent
} from '@campfire/utils/nodePredicates'

describe('isWhitespaceText', () => {
  it('returns true for whitespace-only text nodes', () => {
    const node: MdText = { type: 'text', value: '  \n\t' }
    expect(isWhitespaceText(node)).toBe(true)
  })

  it('returns false for non-whitespace text', () => {
    const node: HastText = { type: 'text', value: 'hello' }
    expect(isWhitespaceText(node)).toBe(false)
  })

  it('returns false for non-text nodes', () => {
    const node = { type: 'paragraph', children: [] } as RootContent
    expect(isWhitespaceText(node as unknown as HastText)).toBe(false)
  })
})

describe('isWhitespaceRootContent', () => {
  it('detects whitespace text nodes', () => {
    const node: RootContent = { type: 'text', value: '  ' } as MdText
    expect(isWhitespaceRootContent(node)).toBe(true)
  })

  it('detects whitespace paragraphs', () => {
    const node: Paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: '\n' } as MdText]
    }
    expect(isWhitespaceRootContent(node)).toBe(true)
  })

  it('detects marker paragraphs', () => {
    const node: Paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: ':::' } as MdText]
    }
    expect(isWhitespaceRootContent(node)).toBe(true)
  })

  it('returns false for paragraphs with content', () => {
    const node: Paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'hi' } as MdText]
    }
    expect(isWhitespaceRootContent(node)).toBe(false)
  })

  it('returns false for non-text nodes', () => {
    const node = { type: 'emphasis', children: [] } as RootContent
    expect(isWhitespaceRootContent(node)).toBe(false)
  })
})
