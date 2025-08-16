import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide/renderDirectiveMarkdown'

let output: ComponentChild | null = null

const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return null
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('deck slide appear integration', () => {
  it('keeps multiple appear directives within the same slide', () => {
    const md = `:::deck{size=800x600}\n\n  :::slide{transition=fade}\n    :::appear{at=0}\n      :::text{x=80 y=80 as="h2"}\n      Hello\n      :::\n    :::\n\n    :::appear{at=1}\n      :::text{x=100 y=100 as="h2"}\n      World\n      :::\n    :::\n  :::\n\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getDeck = (node: any): any => {
      if (Array.isArray(node)) return getDeck(node[0])
      if (node?.type === Fragment) return getDeck(node.props.children)
      return node
    }
    const deck = getDeck(output)
    const slide = Array.isArray(deck.props.children)
      ? deck.props.children[0]
      : deck.props.children
    const children = Array.isArray(slide.props.children)
      ? slide.props.children
      : [slide.props.children]
    const appears = children.filter((c: any) => c.type === 'appear')
    expect(appears.length).toBe(2)
  })
})
