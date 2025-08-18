import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include image directives.
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

describe('image directive', () => {
  it('renders a SlideImage component with props', () => {
    const md =
      ':::appear\n:image{src="https://example.com/cat.png" x=10 y=20 alt="Cat" class="rounded" style="border:1px solid red" data-test="ok"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.getAttribute('data-test')).toBe('ok')
    const img = el.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://example.com/cat.png')
    expect(img.getAttribute('alt')).toBe('Cat')
    expect(img.className).toBe('rounded')
    expect(img.style.border).toBe('1px solid red')
  })
})
