import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

/** Wrapper directive test utilities. */

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include wrapper directives.
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

describe('wrapper directive', () => {
  it('renders the specified element with props', () => {
    const md =
      ':::wrapper{as="section" className="box" data-test="ok"}\nContent\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="wrapper"]') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('campfire-wrapper')
    expect(el.className).toContain('box')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(el.textContent).toContain('Content')
  })

  it('defaults to div when an unsupported tag is provided', () => {
    const md = ':::wrapper{as="article"}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="wrapper"]') as HTMLElement
    expect(el.tagName).toBe('DIV')
  })

  it('does not leave stray markers inside layer', () => {
    const md = ':::layer\n:::wrapper{as="p"}\nHi\n:::\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const layer = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(layer.innerHTML).not.toContain(':::')
    expect(layer.textContent).toBe('Hi')
  })

  it('applies wrapper presets with overrides', () => {
    const md =
      ':preset{type="wrapper" name="box" as="section" className="one" data-test="ok"}\n' +
      ':::wrapper{from="box" as="p" className="two"}\nContent\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="wrapper"]') as HTMLElement
    expect(el.tagName).toBe('P')
    expect(el.className).toContain('campfire-wrapper')
    expect(el.className).toContain('two')
    expect(el.className).not.toContain('one')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(el.textContent).toBe('Content')
  })
})
