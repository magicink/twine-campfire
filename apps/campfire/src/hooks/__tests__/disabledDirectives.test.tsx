import { describe, it, expect, beforeEach } from 'bun:test'
import { render, act } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string including various directives.
 * @returns Rendered content.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return <>{output}</>
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
  resetStores()
})

describe('disabled state directives', () => {
  it('toggles disabled attribute based on state key', async () => {
    useGameStore.setState({ gameData: { disabled: true } })
    const md =
      ':input[name]{disabled=disabled}\n' +
      ':::select[color]{disabled=disabled}\n' +
      '::option{value="r" label="Red"}\n' +
      ':::\n' +
      ':radio[choice]{value="a" disabled=disabled}\n' +
      ':checkbox[check]{disabled=disabled}\n' +
      ':textarea[bio]{disabled=disabled}\n' +
      ':::trigger{label="Go" disabled=disabled}\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const trigger = document.querySelector(
      '[data-testid="trigger-button"]'
    ) as HTMLButtonElement
    const input = document.querySelector(
      '[data-testid="input"]'
    ) as HTMLInputElement
    const select = document.querySelector(
      '[data-testid="select"]'
    ) as HTMLButtonElement
    const radio = document.querySelector(
      '[data-testid="radio"]'
    ) as HTMLButtonElement
    const checkbox = document.querySelector(
      '[data-testid="checkbox"]'
    ) as HTMLButtonElement
    const textarea = document.querySelector(
      '[data-testid="textarea"]'
    ) as HTMLTextAreaElement
    expect(trigger.disabled).toBe(true)
    expect(input.disabled).toBe(true)
    expect(select.disabled).toBe(true)
    expect(radio.disabled).toBe(true)
    expect(checkbox.disabled).toBe(true)
    expect(textarea.disabled).toBe(true)
    await act(() => useGameStore.getState().setGameData({ disabled: false }))
    expect(trigger.disabled).toBe(false)
    expect(input.disabled).toBe(false)
    expect(select.disabled).toBe(false)
    expect(radio.disabled).toBe(false)
    expect(checkbox.disabled).toBe(false)
    expect(textarea.disabled).toBe(false)
  })

  it('toggles disabled attribute based on an expression', async () => {
    useGameStore.setState({ gameData: { count: 1 } })
    const md =
      ':input[name]{disabled="count>2"}\n' +
      ':::select[color]{disabled="count>2"}\n' +
      '::option{value="r" label="Red"}\n' +
      ':::\n' +
      ':radio[choice]{value="a" disabled="count>2"}\n' +
      ':checkbox[check]{disabled="count>2"}\n' +
      ':textarea[bio]{disabled="count>2"}\n' +
      ':::trigger{label="Go" disabled="count>2"}\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const trigger = document.querySelector(
      '[data-testid="trigger-button"]'
    ) as HTMLButtonElement
    const input = document.querySelector(
      '[data-testid="input"]'
    ) as HTMLInputElement
    const select = document.querySelector(
      '[data-testid="select"]'
    ) as HTMLButtonElement
    const radio = document.querySelector(
      '[data-testid="radio"]'
    ) as HTMLButtonElement
    const checkbox = document.querySelector(
      '[data-testid="checkbox"]'
    ) as HTMLButtonElement
    const textarea = document.querySelector(
      '[data-testid="textarea"]'
    ) as HTMLTextAreaElement
    expect(trigger.disabled).toBe(false)
    expect(input.disabled).toBe(false)
    expect(select.disabled).toBe(false)
    expect(radio.disabled).toBe(false)
    expect(checkbox.disabled).toBe(false)
    expect(textarea.disabled).toBe(false)
    await act(() => useGameStore.getState().setGameData({ count: 3 }))
    expect(trigger.disabled).toBe(true)
    expect(input.disabled).toBe(true)
    expect(select.disabled).toBe(true)
    expect(radio.disabled).toBe(true)
    expect(checkbox.disabled).toBe(true)
    expect(textarea.disabled).toBe(true)
  })
})
