import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide/renderDirectiveMarkdown'
import { Appear } from '@campfire/components/Deck/Slide/Appear'

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

describe('appear directive', () => {
  it('renders an Appear component with props', () => {
    const md =
      ':::appear{at=1 exitAt=3 enter="slide" exit="fade" interruptBehavior="cancel" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const getAppear = (node: any): any => {
      if (Array.isArray(node)) return getAppear(node[0])
      if (node?.type === Fragment) return getAppear(node.props.children)
      return node
    }
    const appear = getAppear(output)
    expect(appear.type).toBe(Appear)
    expect(appear.props.at).toBe(1)
    expect(appear.props.exitAt).toBe(3)
    expect(appear.props.enter).toBe('slide')
    expect(appear.props.exit).toBe('fade')
    expect(appear.props.interruptBehavior).toBe('cancel')
    expect(appear.props['data-test']).toBe('ok')
  })

  it('does not render stray colons when appear contains directives', () => {
    const md = `:::appear\n:::if{true}\nHi\n:::\n:::\n`
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
