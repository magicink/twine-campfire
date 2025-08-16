import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide/renderDirectiveMarkdown'
import { Text } from '@campfire/components/Deck/Slide/Text'

let output: ComponentChild | null = null

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
  it('renders a Text component with props', () => {
    const md =
      ':::text{x=10 y=20 w=100 h=50 as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red"}\nHello\n:::'
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
    expect(text.props.as).toBe('h2')
    expect(text.props.align).toBe('center')
    expect(text.props.size).toBe(24)
    expect(text.props.weight).toBe(700)
    expect(text.props.lineHeight).toBe(1.2)
    expect(text.props.color).toBe('red')
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
