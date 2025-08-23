import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
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

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('slide directive', () => {
  it('renders a Slide component with transition props', () => {
    const md =
      ':::deck\n:::slide{enter="slide" enterDir="left" enterDuration=500 exit="fade" exitDir="down" exitDuration=400 data-test="ok"}\nHello\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getSlide = (node: any): any => {
      if (Array.isArray(node)) return node.map(getSlide).find(Boolean)
      if (node?.type === Fragment) return getSlide(node.props.children)
      if (node?.type === Slide) return node
      if (node?.props?.children) return getSlide(node.props.children)
      return undefined
    }
    const slide = getSlide(output)
    expect(slide.type).toBe(Slide)
    expect(slide.props.transition).toEqual({
      enter: { type: 'slide', dir: 'left', duration: 500 },
      exit: { type: 'fade', dir: 'down', duration: 400 }
    })
    expect(slide.props['data-test']).toBe('ok')
  })

  it('applies slide presets with overrides', () => {
    const md =
      ':preset{type="slide" name="fade" enter="slide" enterDir="right" enterDuration=200 exit="zoom" exitDir="left"}\n:::deck\n:::slide{from="fade" exitDir="up" exitDuration=700}\nHi\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getSlide = (node: any): any => {
      if (Array.isArray(node)) return node.map(getSlide).find(Boolean)
      if (node?.type === Fragment) return getSlide(node.props.children)
      if (node?.type === Slide) return node
      if (node?.props?.children) return getSlide(node.props.children)
      return undefined
    }
    const slide = getSlide(output)
    expect(slide.props.transition).toEqual({
      enter: { type: 'slide', dir: 'right', duration: 200 },
      exit: { type: 'zoom', dir: 'up', duration: 700 }
    })
  })

  it('supports the flip transition type', () => {
    const md = ':::deck\n:::slide{enter="flip" enterDuration=500}\nHi\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getSlide = (node: any): any => {
      if (Array.isArray(node)) return node.map(getSlide).find(Boolean)
      if (node?.type === Fragment) return getSlide(node.props.children)
      if (node?.type === Slide) return node
      if (node?.props?.children) return getSlide(node.props.children)
      return undefined
    }
    const slide = getSlide(output)
    expect(slide.props.transition).toEqual({
      enter: { type: 'flip', duration: 500 }
    })
  })
})
