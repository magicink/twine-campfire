import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide/renderDirectiveMarkdown'
import { Text } from '@campfire/components/Deck/Slide/Text'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include directive containers.
 * @returns Nothing; sets `output` with rendered content.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return null
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('text directive', () => {
  it('renders a Text component with attributes', () => {
    const md =
      ':::text{x=10 y=20 w=100 h=50 z=5 rotate=45 scale=1.5 anchor=center as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red" class="underline" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getText = (node: any): any => {
      if (Array.isArray(node)) return getText(node[0])
      if (node?.type === Fragment) return getText(node.props.children)
      return node
    }
    const text = getText(output)
    expect(text.type).toBe(Text)
    expect(text.props.x).toBe(10)
    expect(text.props.y).toBe(20)
    expect(text.props.w).toBe(100)
    expect(text.props.h).toBe(50)
    expect(text.props.z).toBe(5)
    expect(text.props.rotate).toBe(45)
    expect(text.props.scale).toBe(1.5)
    expect(text.props.anchor).toBe('center')
    expect(text.props.as).toBe('h2')
    expect(text.props.align).toBe('center')
    expect(text.props.size).toBe(24)
    expect(text.props.weight).toBe(700)
    expect(text.props.lineHeight).toBe(1.2)
    expect(text.props.color).toBe('red')
    expect(text.props.className).toBe('underline')
    expect(text.props['data-test']).toBe('ok')
    expect(text.props.children).toBe('Hello')
  })

  it('does not render stray colons when text contains directives', () => {
    const md = ':::text\n:::if{true}\nHi\n:::\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const getTextContent = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(getTextContent).join('')
      if (node.props?.children) return getTextContent(node.props.children)
      return ''
    }
    const text = getTextContent(output)
    expect(text).not.toContain(':::')
  })
})
