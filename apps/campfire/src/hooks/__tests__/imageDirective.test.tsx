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
      ':::reveal\n::image{src="https://example.com/cat.png" x=10 y=20 alt="Cat" className="rounded" layerClassName="wrapper" style="border:1px solid red" data-test="ok"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('campfire-slide-layer')
    expect(el.className).toContain('wrapper')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.getAttribute('data-test')).toBe('ok')
    const img = el.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://example.com/cat.png')
    expect(img.getAttribute('alt')).toBe('Cat')
    expect(img.className).toContain('campfire-slide-image')
    expect(img.className).toContain('rounded')
    expect(img.style.border).toBe('1px solid red')
  })

  it('handles hyphenated class names without evaluation', () => {
    const md =
      ':::reveal\n::image{src="https://example.com/cat.png" className="w-full"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const img = document.querySelector(
      '[data-testid="slideImage"] img'
    ) as HTMLImageElement
    expect(img.className).toContain('campfire-slide-image')
    expect(img.className).toContain('w-full')
  })

  it('does not wrap SlideImage in a paragraph', () => {
    const md = ':::reveal\n::image{src="https://example.com/cat.png"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(el.closest('p')).toBeNull()
  })

  it('applies image presets with overrides', () => {
    const md =
      ':preset{type="image" name="cat" x=5 y=5 src="https://example.com/cat.png"}\n:::reveal\n::image{from="cat" y=10}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(el.style.left).toBe('5px')
    expect(el.style.top).toBe('10px')
    const img = el.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://example.com/cat.png')
  })

  it('applies class names from presets', () => {
    const md =
      ':preset{type="image" name="cat" className="rounded" layerClassName="wrap" src="https://example.com/cat.png"}\n:::reveal\n::image{from="cat"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(el.className).toContain('wrap')
    const img = el.querySelector('img') as HTMLImageElement
    expect(img.className).toContain('rounded')
  })
})
