import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { Appear } from '@campfire/components/Deck/Slide'
import { DeckText } from '@campfire/components/Deck/Slide'
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
  return null
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

/**
 * Recursively concatenates text content from a component node tree.
 *
 * @param node - The node to extract text from.
 * @returns A string containing all text within the node.
 */
const getText = (node: any): string => {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(getText).join('')
  if (node.props?.children) return getText(node.props.children)
  return ''
}

describe('deck directive', () => {
  it('renders a deck with slide children', () => {
    const md = `:::deck{size=16x9 transition=slide}
:::slide{transition=fade background="bg-indigo-50"}
# One
:::
::slide{}
## Two
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
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides.length).toBe(2)
    expect(slides[0].type).toBe(Slide)
    expect(slides[1].type).toBe(Slide)
  })

  it('wraps non-slide content in a default slide', () => {
    const md = `:::deck
# Solo
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides.length).toBe(1)
    expect(slides[0].type).toBe(Slide)
  })

  it('does not render stray colons when slide contains directives', () => {
    const md = `:::deck\n:::slide\n:::if{true}\nHi\n:::\n:::\n:::\n`
    render(<MarkdownRunner markdown={md} />)
    const text = getText(output)
    expect(text).not.toContain(':::')
  })

  it('keeps nested appear directives within a slide', () => {
    const md = `:::deck{size=800x600}
  :::slide{transition=fade}
    :::appear{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::appear{at=1}
      :::text{x=100 y=100 as="h2"}
      World
      :::
    :::
  :::
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides.length).toBe(1)
    const slide = slides[0]
    const slideChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(slideChildren.length).toBe(2)
    expect(slideChildren[0].type).toBe(Appear)
    expect(slideChildren[1].type).toBe(Appear)
    const text = getText(output)
    expect(text).not.toContain(':::')
  })

  it('does not create extra slides from whitespace', () => {
    const md = `:::deck{size=800x600}
  :::slide{transition=fade}
    :::appear{at=0}
      :::text{x=80 y=80 as="h2"}Hello:::
    :::
    :::appear{at=1}
      :::text{x=100 y=100 as="h2"}World:::
    :::
  :::
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides.length).toBe(1)
    const slide = slides[0]
    const slideChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(slideChildren.length).toBe(2)
    expect(slideChildren[0].type).toBe(Appear)
    expect(slideChildren[1].type).toBe(Appear)
  })

  it('merges stray appear directives into the previous slide', () => {
    const md = `:::deck{size=800x600}
  :::slide{transition=fade}
    :::appear{at=0}
      :::text{x=80 y=80 as="h2"}Hello:::
    :::
  :::
  :::appear{at=1}
    :::text{x=100 y=100 as="h2"}World:::
  :::
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides.length).toBe(1)
    const slide = slides[0]
    const slideChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(slideChildren.length).toBe(2)
    expect(slideChildren[0].type).toBe(Appear)
    expect(slideChildren[1].type).toBe(Appear)
  })

  it('matches the Storybook deck example', () => {
    const md = `:::deck{size=800x600}
  :::slide{transition=fade}
    :::appear{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::appear{at=1}
      :::text{x=100 y=100 as="h2"}
      World
      :::
    :::
  :::
:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck).toMatchObject({
      type: Deck,
      props: { size: { width: 800, height: 600 } }
    })
    const slides = Array.isArray(deck.props.children)
      ? deck.props.children
      : [deck.props.children]
    expect(slides).toHaveLength(1)
    const [slide] = slides
    expect(slide).toMatchObject({
      type: Slide,
      props: { transition: { type: 'fade' } }
    })
    const appearChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(appearChildren).toHaveLength(2)
    expect(appearChildren[0]).toMatchObject({
      type: Appear,
      props: {
        at: 0,
        children: {
          type: DeckText,
          props: { as: 'h2', x: 80, y: 80, children: 'Hello' }
        }
      }
    })
    expect(appearChildren[1]).toMatchObject({
      type: Appear,
      props: {
        at: 1,
        children: {
          type: DeckText,
          props: { as: 'h2', x: 100, y: 100, children: 'World' }
        }
      }
    })
    const text = getText(output)
    expect(text).toBe('HelloWorld')
  })
})
