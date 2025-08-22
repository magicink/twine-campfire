import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include layer directives.
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

describe('layer directive', () => {
  it('renders a Layer component with props', () => {
    const md =
      ':::layer{x=10 y=20 w=30 h=40 z=5 rotate=45 scale=2 anchor="center" class="box" data-test="ok"}\nContent\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.height).toBe('40px')
    expect(el.style.zIndex).toBe('5')
    expect(el.style.transform).toBe('rotate(45deg) scale(2)')
    expect(el.style.transformOrigin).toBe('50% 50%')
    expect(el.className).toBe('box')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(el.textContent).toContain('Content')
  })

  it('applies layer presets with overrides', () => {
    const md =
      ':preset{type="layer" name="base" x=5 y=5 z=2}\n:::layer{from="base" y=10}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(el.style.left).toBe('5px')
    expect(el.style.top).toBe('10px')
    expect(el.style.zIndex).toBe('2')
  })
})
