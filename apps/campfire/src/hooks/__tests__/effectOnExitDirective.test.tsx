import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import type { RootContent } from 'mdast'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import * as EffectModule from '@campfire/components/Passage/Effect'
import * as OnExitModule from '@campfire/components/Passage/OnExit'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include directive containers.
 * @returns Rendered directive output within a fragment.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  return <Fragment>{renderDirectiveMarkdown(markdown, handlers)}</Fragment>
}

/**
 * Normalizes watch values into an array of keys.
 *
 * @param value - Raw watch property provided to the Effect component.
 * @returns Array of parsed watch keys.
 */
const parseWatchValues = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(item => String(item))
    : String(value ?? '')
        .split(/[\s,]+/)
        .filter(Boolean)

beforeEach(() => {
  document.body.innerHTML = ''
  resetStores()
})

describe('effect directive', () => {
  it('serializes allowed directives with watch attributes', () => {
    const md = [
      ':::effect{watch="hp, mp"}',
      '::set{key=hp value=2}',
      '::goto[Next]',
      '::random{key=mp min=1 max=6}',
      ':::'
    ].join('\n')
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    const calls: Array<{ watch: unknown; content: string }> = []
    const effectSpy = spyOn(EffectModule, 'Effect').mockImplementation(
      props => {
        calls.push(props as { watch: unknown; content: string })
        return null
      }
    )
    try {
      render(<MarkdownRunner markdown={md} />)
      expect(calls).toHaveLength(1)
      const props = calls[0]
      expect(parseWatchValues(props.watch)).toEqual(['hp', 'mp'])
      const nodes = JSON.parse(props.content) as RootContent[]
      expect(nodes).toHaveLength(2)
      expect(nodes.map(node => (node as any).name)).toEqual(['set', 'random'])
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      effectSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })

  it('falls back to the directive label for watch values', () => {
    const md = [
      ':::effect[hp energy]',
      '::set{key=hp value=1}',
      '::random{key=energy min=1 max=2}',
      ':::'
    ].join('\n')
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    const calls: Array<{ watch: unknown; content: string }> = []
    const effectSpy = spyOn(EffectModule, 'Effect').mockImplementation(
      props => {
        calls.push(props as { watch: unknown; content: string })
        return null
      }
    )
    try {
      render(<MarkdownRunner markdown={md} />)
      expect(calls).toHaveLength(1)
      const props = calls[0]
      expect(parseWatchValues(props.watch)).toEqual(['hp', 'energy'])
      const nodes = JSON.parse(props.content) as RootContent[]
      expect(nodes.map(node => (node as any).name)).toEqual(['set', 'random'])
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      effectSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})

describe('onExit directive', () => {
  it('serializes allowed directives and filters unsupported ones', () => {
    const md = [
      ':::onExit',
      '::set{key=seen value=true}',
      '::goto[Next]',
      '::random{key=roll min=1 max=6}',
      ':::'
    ].join('\n')
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    const calls: Array<{ content: string }> = []
    const onExitSpy = spyOn(OnExitModule, 'OnExit').mockImplementation(
      props => {
        calls.push(props as { content: string })
        return null
      }
    )
    try {
      render(<MarkdownRunner markdown={md} />)
      expect(calls).toHaveLength(1)
      const props = calls[0]
      const nodes = JSON.parse(props.content) as RootContent[]
      expect(nodes).toHaveLength(2)
      expect(nodes.map(node => (node as any).name)).toEqual(['set', 'random'])
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      onExitSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})
