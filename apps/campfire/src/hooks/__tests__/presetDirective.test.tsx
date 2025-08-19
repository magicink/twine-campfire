import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { Deck } from '@campfire/components/Deck'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

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
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve(),
    cancel: () => {},
    finish: () => {}
  })
})

describe('preset directive', () => {
  it('applies presets to deck and text directives', () => {
    const md = `:preset{type="deck" name="wide" size="16x9" theme="dark"}
:preset{type="text" name="title" x=100 y=50 size=32 color="#333"}
:::deck{from="wide"}
:::slide
:text[Welcome]{from="title"}
:::
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.type).toBe(Deck)
    expect(deck.props.size.width).toBe(DEFAULT_DECK_WIDTH)
    expect(deck.props.size.height).toBe(DEFAULT_DECK_HEIGHT)
    expect(deck.props.theme.theme).toBe('dark')
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    const inner = el.firstElementChild as HTMLElement
    const style = inner.getAttribute('style') || ''
    expect(style).toContain('left: 100px')
    expect(style).toContain('top: 50px')
    expect(style).toContain('font-size: 32px')
    expect(style).toContain('#333')
  })
})
