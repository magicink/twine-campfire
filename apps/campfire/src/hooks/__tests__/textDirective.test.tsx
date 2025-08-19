import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { SlideText } from '@campfire/components/Deck/Slide'

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
  it('renders a SlideText component with styles', () => {
    const md =
      ':text[Hello]{x=10 y=20 w=100 h=50 z=5 rotate=45 scale=1.5 anchor=center as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red" class="underline" data-test="ok"}'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
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

  it('applies text presets with overrides', () => {
    const md =
      ':preset{type="text" name="title" x=10 y=20 size=24 color="red"}\n:text[Hi]{from="title" size=32}'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    const inner = el.firstElementChild as HTMLElement
    const style = inner.getAttribute('style') || ''
    expect(style).toContain('left: 10px')
    expect(style).toContain('top: 20px')
    expect(style).toContain('font-size: 32px')
    expect(style).toContain('color: red')
  })
})
