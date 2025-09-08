import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: ComponentChild | null = null

/**
 * Renders markdown with directive handlers for testing.
 *
 * @param markdown - Markdown string containing directives.
 * @returns Rendered content via renderDirectiveMarkdown.
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

describe('embed directive', () => {
  it('renders a SlideEmbed component with props', () => {
    const md =
      ':::reveal\n::embed{src="https://www.youtube.com/embed/vid" allow="autoplay" allowFullScreen=true layerClassName="wrapper"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideEmbed"]'
    ) as HTMLElement
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('wrapper')
    const iframe = el.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.getAttribute('src')).toBe('https://www.youtube.com/embed/vid')
    expect(iframe.getAttribute('allow')).toBe('autoplay')
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true)
  })

  it('defaults allowFullScreen to false when omitted', () => {
    const md =
      ':::reveal\n::embed{src="https://www.youtube.com/embed/vid"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const iframe = document.querySelector(
      '[data-testid="slideEmbed"] iframe'
    ) as HTMLIFrameElement
    expect(iframe.hasAttribute('allowfullscreen')).toBe(false)
  })
})
