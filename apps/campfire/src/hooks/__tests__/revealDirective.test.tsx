import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
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

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('reveal directive', () => {
  it('renders a SlideReveal component with props', () => {
    const md =
      ':::reveal{at=1 exitAt=3 enter="slide" exit="fade" interruptBehavior="cancel" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getReveal = (node: any): any => {
      if (Array.isArray(node)) return getReveal(node[0])
      if (node?.type === Fragment) return getReveal(node.props.children)
      return node
    }
    const reveal = getReveal(output)
    expect(reveal.type).toBe(SlideReveal)
    expect(reveal.props.at).toBe(1)
    expect(reveal.props.exitAt).toBe(3)
    expect(reveal.props.enter).toEqual({ type: 'slide' })
    expect(reveal.props.exit).toEqual({ type: 'fade' })
    expect(reveal.props.interruptBehavior).toBe('cancel')
    expect(reveal.props['data-test']).toBe('ok')
  })

  it('parses quoted JSON transition objects', () => {
    const md = `:::reveal{at=0 enter='{"type":"slide","dir":"left","duration":300}' exit='{"type":"fade","duration":150}'}\nHi\n:::`
    render(<MarkdownRunner markdown={md} />)
    const getReveal = (node: any): any => {
      if (Array.isArray(node)) return getReveal(node[0])
      if (node?.type === Fragment) return getReveal(node.props.children)
      return node
    }
    const reveal = getReveal(output)
    expect(reveal.props.enter).toEqual({
      type: 'slide',
      dir: 'left',
      duration: 300
    })
    expect(reveal.props.exit).toEqual({ type: 'fade', duration: 150 })
  })

  it('applies reveal presets with overrides', () => {
    const md =
      ':preset{type="reveal" name="fade" at=2}\n:::reveal{from="fade" exitAt=3}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getReveal = (node: any): any => {
      if (Array.isArray(node)) return getReveal(node[0])
      if (node?.type === Fragment) return getReveal(node.props.children)
      return node
    }
    const reveal = getReveal(output)
    expect(reveal.props.at).toBe(2)
    expect(reveal.props.exitAt).toBe(3)
  })

  it('does not render stray colons when reveal contains directives', () => {
    const md = `:::reveal\n:::if[true]\nHi\n:::\n:::\n`
    render(<MarkdownRunner markdown={md} />)
    const getText = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(getText).join('')
      if (node.props?.children) return getText(node.props.children)
      return ''
    }
    const text = getText(output)
    expect(text).not.toContain(':::')
  })
})
