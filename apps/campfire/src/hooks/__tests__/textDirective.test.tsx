import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { DeckText } from '@campfire/components/Deck/Slide'

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
  return <>{output}</>
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('text directive', () => {
  it('renders a DeckText component with styles', () => {
    const md =
      ':::text{x=10 y=20 w=100 h=50 z=5 rotate=45 scale=1.5 anchor=center as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red" class="underline" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="deckText"]') as HTMLElement
    expect(el).toBeTruthy()
    const inner = el.firstElementChild as HTMLElement
    expect(inner.tagName).toBe('H2')
    const rawStyle = inner.getAttribute('style') || ''
    const style = rawStyle
      .split(';')
      .filter(Boolean)
      .map(rule => {
        const [prop, ...rest] = rule.split(':')
        const name = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return [name, rest.join(':').trim()]
      })
    const styleObj = Object.fromEntries(style)
    expect(styleObj.position).toBe('absolute')
    expect(styleObj.left).toBe('10px')
    expect(styleObj.top).toBe('20px')
    expect(styleObj.width).toBe('100px')
    expect(styleObj.height).toBe('50px')
    expect(styleObj.zIndex).toBe('5')
    expect(styleObj.transform).toContain('rotate(45deg)')
    expect(styleObj.transform).toContain('scale(1.5)')
    expect(styleObj.transformOrigin).toBe('50% 50%')
    expect(styleObj.textAlign).toBe('center')
    expect(styleObj.fontSize).toBe('24px')
    expect(styleObj.fontWeight).toBe('700')
    expect(styleObj.lineHeight).toBe('1.2')
    expect(styleObj.color).toBe('red')
    expect(inner.className.split(' ')).toEqual(
      expect.arrayContaining(['underline', 'text-base', 'font-normal'])
    )
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(inner.textContent).toBe('Hello')
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
