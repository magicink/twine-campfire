import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include shape directives.
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
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve(),
    cancel: () => {},
    finish: () => {}
  })
})

describe('shape directive', () => {
  it('renders a SlideShape component with props', () => {
    const md =
      ':::appear\n:shape{x=10 y=20 w=100 h=50 type="rect" stroke="red" fill="blue" radius=5 shadow=true class="rounded" data-test="ok"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('50px')
    expect(el.getAttribute('data-test')).toBe('ok')
    const svg = el.querySelector('svg') as SVGSVGElement
    const rect = svg.querySelector('rect') as SVGRectElement
    expect(rect.getAttribute('stroke')).toBe('red')
    expect(rect.getAttribute('fill')).toBe('blue')
    expect(rect.getAttribute('rx')).toBe('5')
    expect(svg.classList.contains('rounded')).toBe(true)
    expect(svg.style.filter).toContain('drop-shadow')
  })

  it('does not render stray colons after shape blocks', () => {
    const md = ':shape{type="rect"}\n:::if{true}\nHi\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const text = document.body.textContent || ''
    expect(text).not.toContain(':::')
  })
})
