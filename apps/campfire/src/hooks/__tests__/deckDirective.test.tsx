import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@campfire/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@campfire/rehype-campfire'
import rehypeReact from 'rehype-react'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { If } from '@campfire/components/Passage/If'
import { Show } from '@campfire/components/Passage/Show'
import { OnExit } from '@campfire/components/Passage/OnExit'

let output: ComponentChild | null = null

const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers })
    .use(remarkRehype)
    .use(rehypeCampfire)
    .use(rehypeReact, {
      Fragment,
      jsx,
      jsxs,
      components: {
        button: LinkButton,
        trigger: TriggerButton,
        if: If,
        show: Show,
        onExit: OnExit,
        deck: Deck,
        slide: Slide
      }
    })
  const file = processor.processSync(markdown)
  output = file.result as ComponentChild
  return null
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

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
    expect(deck.props.size.width).toBe(1920)
    expect(deck.props.size.height).toBe(1080)
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
})
