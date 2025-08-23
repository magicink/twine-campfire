import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild, VNode } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { SlideReveal } from '@campfire/components/Deck/Slide'

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

/**
 * Traverses rendered children to locate the SlideReveal vnode.
 *
 * @param node - Rendered node tree.
 * @returns The SlideReveal vnode when found.
 */
const findReveal = (node: ComponentChild | null): VNode<any> | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findReveal(child)
      if (found) return found
    }
    return undefined
  }
  const vnode = node as VNode
  if (vnode?.type === Fragment) return findReveal(vnode.props.children)
  return vnode as VNode<any>
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('reveal directive', () => {
  it('renders a SlideReveal component with props', () => {
    const md =
      ':::reveal{at=1 exitAt=3 enter="slide" enterDir="left" enterDuration=500 exit="fade" exitDir="down" exitDuration=400 interruptBehavior="cancel" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const reveal = findReveal(output)!
    expect(reveal.type).toBe(SlideReveal)
    expect(reveal.props.at).toBe(1)
    expect(reveal.props.exitAt).toBe(3)
    expect(reveal.props.enter).toEqual({
      type: 'slide',
      dir: 'left',
      duration: 500
    })
    expect(reveal.props.exit).toEqual({
      type: 'fade',
      dir: 'down',
      duration: 400
    })
    expect(reveal.props.interruptBehavior).toBe('cancel')
    expect(reveal.props['data-test']).toBe('ok')
  })

  it('applies reveal presets with overrides', () => {
    const md =
      ':preset{type="reveal" name="fade" at=2 enter="slide" enterDir="right" enterDuration=200 exit="zoom" exitDir="left"}\n:::reveal{from="fade" exitAt=3 enterDir="up" exitDuration=700}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const reveal = findReveal(output)!
    expect(reveal.props.at).toBe(2)
    expect(reveal.props.exitAt).toBe(3)
    expect(reveal.props.enter).toEqual({
      type: 'slide',
      dir: 'up',
      duration: 200
    })
    expect(reveal.props.exit).toEqual({
      type: 'zoom',
      dir: 'left',
      duration: 700
    })
  })

  it('supports the flip transition type', () => {
    const md = ':::reveal{at=1 enter="flip" enterDuration=500}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const reveal = findReveal(output)!
    expect(reveal.props.enter).toEqual({ type: 'flip', duration: 500 })
  })

  it('does not render stray colons when reveal contains directives', () => {
    const md = `:::reveal\n:::if[true]\nHi\n:::\n:::\n`
    render(<MarkdownRunner markdown={md} />)
    /**
     * Recursively gathers text content from rendered children.
     *
     * @param node - Node to extract text from.
     * @returns The concatenated text content.
     */
    const getText = (node: ComponentChild | null): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(getText).join('')
      const vnode = node as VNode
      return vnode.props?.children ? getText(vnode.props.children) : ''
    }
    const text = getText(output)
    expect(text).not.toContain(':::')
  })
})
