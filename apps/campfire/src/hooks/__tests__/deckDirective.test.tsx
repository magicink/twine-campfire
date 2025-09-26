import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { SlideReveal } from '@campfire/components/Deck/Slide'
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
    const md = `:::deck{size='16x9' transition='slide'}
:::slide{transition='fade'}
# One
:::
:::slide
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

  it('requires slide transition values to be quoted or state keys', () => {
    const md = `:::deck\n:::slide{transition=fade}\nHi\n:::\n:::`
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
    expect(slides).toHaveLength(1)
    const [slide] = slides
    expect(slide.props.transition).toBeUndefined()
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
    const md = `:::deck\n:::slide\n:::if[true]\nHi\n:::\n:::\n:::\n`
    render(<MarkdownRunner markdown={md} />)
    const text = getText(output)
    expect(text).not.toContain(':::')
  })

  it('keeps nested reveal directives within a slide', () => {
    const md = `:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::reveal{at=1}
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
    expect(slideChildren[0].type).toBe(SlideReveal)
    expect(slideChildren[1].type).toBe(SlideReveal)
    const text = getText(output)
    expect(text).not.toContain(':::')
  })

  it('does not create extra slides from whitespace', () => {
    const md = `:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::reveal{at=1}
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
    expect(slideChildren[0].type).toBe(SlideReveal)
    expect(slideChildren[1].type).toBe(SlideReveal)
  })

  it('merges stray reveal directives into the previous slide', () => {
    const md = `:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
  :::
  :::reveal{at=1}
    :::text{x=100 y=100 as="h2"}
    World
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
    expect(slideChildren[0].type).toBe(SlideReveal)
    expect(slideChildren[1].type).toBe(SlideReveal)
  })

  it('matches the Storybook deck example', () => {
    const md = `:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::reveal{at=1}
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
      props: {
        transition: {
          enter: { type: 'fade' },
          exit: { type: 'fade' }
        }
      }
    })
    const revealChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(revealChildren).toHaveLength(2)
    const [first, second] = revealChildren
    expect(first).toMatchObject({ type: SlideReveal, props: { at: 0 } })
    expect(getText(first)).toBe('Hello')
    expect(second).toMatchObject({ type: SlideReveal, props: { at: 1 } })
    expect(getText(second)).toBe('World')
    const text = getText(output)
    expect(text).toBe('HelloWorld')
  })

  it('applies deck presets with overrides', () => {
    const md =
      '::preset{type="deck" name="wide" theme="dark" transition="fade"}\n:::deck{from="wide" transition="slide"}\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.transition).toBe('slide')
    expect(deck.props.theme.theme).toBe('dark')
  })

  it('passes autoplay options to the Deck component', () => {
    const md = `:::deck{autoplay=true autoplayDelay=3000 pause=true}\n:::slide\nHi\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.autoAdvanceMs).toBe(3000)
    expect(deck.props.autoAdvancePaused).toBe(true)
  })

  it('hides navigation when hideNavigation is true', () => {
    const md = `:::deck{hideNavigation=true}\n:::slide\nHi\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.hideNavigation).toBe(true)
  })

  it('shows navigation when hideNavigation is false', () => {
    const md = `:::deck{hideNavigation=false}\n:::slide\nHi\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.hideNavigation).toBeUndefined()
  })

  it('shows slide count when showSlideCount is true', () => {
    const md = `:::deck{showSlideCount=true}\n:::slide\nHi\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.showSlideCount).toBe(true)
  })

  it('hides slide count when showSlideCount is false', () => {
    const md = `:::deck{showSlideCount=false}\n:::slide\nHi\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.showSlideCount).toBeUndefined()
  })

  it('uses the provided initial slide', () => {
    const md = `:::deck{initialSlide=2}\n:::slide\nA\n:::\n:::slide\nB\n:::\n:::slide\nC\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.initialSlide).toBe(2)
  })

  it('parses a11y label overrides from the docs example', () => {
    const md = `:::deck{a11y='{"deck":"Carousel","next":"Forward","prev":"Back","play":"Start","pause":"Stop"}'}\n:::slide\nContent\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    expect(deck.props.a11y.deck).toBe('Carousel')
    expect(deck.props.a11y.next).toBe('Forward')
    expect(deck.props.a11y.prev).toBe('Back')
    expect(deck.props.a11y.play).toBe('Start')
    expect(deck.props.a11y.pause).toBe('Stop')
  })

  it('handles leading newline before deck', () => {
    const md = `\n:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::reveal{at=1}
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
    const [slide] = slides
    const slideChildren = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    expect(slideChildren).toHaveLength(2)
    expect(slideChildren[0].type).toBe(SlideReveal)
    expect(slideChildren[1].type).toBe(SlideReveal)
  })
})
