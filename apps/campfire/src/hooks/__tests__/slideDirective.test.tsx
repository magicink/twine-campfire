import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild, VNode } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { Slide } from '@campfire/components/Deck/Slide'

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
 * Traverses rendered children to locate the Slide vnode.
 *
 * @param node - Rendered node tree.
 * @returns The Slide vnode when found.
 */
const findSlide = (node: ComponentChild | null): VNode<any> | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findSlide(child)
      if (found) return found
    }
    return undefined
  }
  const vnode = node as VNode
  if (vnode?.type === Fragment) return findSlide(vnode.props.children)
  if (vnode?.type === Slide) return vnode as VNode<any>
  return vnode?.props?.children ? findSlide(vnode.props.children) : undefined
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('slide directive', () => {
  it('renders a Slide component with transition props', () => {
    const md =
      ':::deck\n:::slide{enter="slide" enterDir="left" enterDuration=500 enterDelay=100 enterEasing="ease-in" exit="fade" exitDir="down" exitDuration=400 exitDelay=200 exitEasing="ease-out" data-test="ok"}\nHello\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const slide = findSlide(output)!
    expect(slide.type).toBe(Slide)
    expect(slide.props.transition).toEqual({
      enter: {
        type: 'slide',
        dir: 'left',
        duration: 500,
        delay: 100,
        easing: 'ease-in'
      },
      exit: {
        type: 'fade',
        dir: 'down',
        duration: 400,
        delay: 200,
        easing: 'ease-out'
      }
    })
    expect(slide.props['data-test']).toBe('ok')
  })

  it('applies slide presets with overrides', () => {
    const md =
      ':preset{type="slide" name="fade" enter="slide" enterDir="right" enterDuration=200 exit="zoom" exitDir="left"}\n:::deck\n:::slide{from="fade" exitDir="up" exitDuration=700}\nHi\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const slide = findSlide(output)!
    expect(slide.props.transition).toEqual({
      enter: { type: 'slide', dir: 'right', duration: 200 },
      exit: { type: 'zoom', dir: 'up', duration: 700 }
    })
  })

  it('supports the flip transition type', () => {
    const md = ':::deck\n:::slide{enter="flip" enterDuration=500}\nHi\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const slide = findSlide(output)!
    expect(slide.props.transition).toEqual({
      enter: { type: 'flip', duration: 500 }
    })
  })
})
