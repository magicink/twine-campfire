import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide/renderDirectiveMarkdown'

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
  it('renders a positioned HTML element with styles', () => {
    const md =
      ':::text{x=10 y=20 w=100 h=50 z=5 rotate=45 scale=1.5 anchor=center as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red" class="underline" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getEl = (node: any): any => {
      if (Array.isArray(node)) return getEl(node[0])
      if (node?.type === Fragment) return getEl(node.props.children)
      return node
    }
    const el = getEl(output)
    expect(el.type).toBe('h2')
    const style = el.props.style
    expect(style.position).toBe('absolute')
    expect(style.left).toBe('10px')
    expect(style.top).toBe('20px')
    expect(style.width).toBe('100px')
    expect(style.height).toBe('50px')
    expect(style.zIndex).toBe('5')
    expect(style.transform).toContain('rotate(45deg)')
    expect(style.transform).toContain('scale(1.5)')
    expect(style.transformOrigin).toBe('50% 50%')
    expect(style.textAlign).toBe('center')
    expect(style.fontSize).toBe('24px')
    expect(style.fontWeight).toBe('700')
    expect(style.lineHeight).toBe('1.2')
    expect(style.color).toBe('red')
    expect(el.props.className.split(' ')).toEqual(
      expect.arrayContaining(['underline', 'text-base', 'font-normal'])
    )
    expect(el.props['data-test']).toBe('ok')
    expect(el.props.children).toBe('Hello')
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
