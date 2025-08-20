import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { SlideReveal } from '@campfire/components/Deck/Slide'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: any = null
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return null
}

describe('deck directive', () => {
  beforeEach(() => {
    output = null
    document.body.innerHTML = ''
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
:::
`
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
