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

  it('avoids nested paragraphs when rendering a p tag', () => {
    const md = ':::wrapper{as="p"}\nWrapped content\n:::'
    render(<MarkdownRunner markdown={md} />)
    const wrapper = document.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement
    expect(wrapper.tagName).toBe('P')
    expect(wrapper.querySelector('p')).toBeNull()
    expect(wrapper.textContent).toBe('Wrapped content')
  })

  it('unwraps paragraphs when rendering a span tag', () => {
    const md = ':::wrapper{as="span"}\nWrapped content\n:::'
    render(<MarkdownRunner markdown={md} />)
    const wrapper = document.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement
    expect(wrapper.tagName).toBe('SPAN')
    expect(wrapper.querySelector('p')).toBeNull()
    expect(wrapper.textContent).toBe('Wrapped content')
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

  it('does not wrap inline radio content in paragraphs', () => {
    const md =
      ':preset{type="wrapper" name="radioLabel" as="div" className="flex items-center gap-2"}\n' +
      '::set[choice="b"]\n' +
      ':::layer{className="flex gap-[12px] items-center justify-center"}\n' +
      '  :::wrapper{from="radioLabel"}\n' +
      '    :radio[choice]{value="a"}\n' +
      '    Hi\n' +
      '  :::\n' +
      '  :::wrapper{from="radioLabel"}\n' +
      '    :radio[choice]{value="b"}\n' +
      '    Hello\n' +
      '  :::\n' +
      '  :::wrapper{from="radioLabel"}\n' +
      '    :radio[choice]{value="c" disabled="true"}\n' +
      '    Goodbye\n' +
      '  :::\n' +
      ':::'
    render(<MarkdownRunner markdown={md} />)
    const layer = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(layer.querySelectorAll('p').length).toBe(0)
    const wrappers = layer.querySelectorAll('[data-testid="wrapper"]')
    expect(wrappers).toHaveLength(3)
    expect(wrappers[0].textContent?.trim()).toBe('Hi')
    expect(wrappers[1].textContent?.trim()).toBe('Hello')
    expect(wrappers[2].textContent?.trim()).toBe('Goodbye')
  })
})
