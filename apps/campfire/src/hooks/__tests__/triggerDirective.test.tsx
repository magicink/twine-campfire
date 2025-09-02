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
 * @param markdown - Markdown string that may include trigger directives.
 * @returns Nothing; sets `output` with rendered content.
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

describe('trigger directive', () => {
  it('renders text and image in a child wrapper before an inline directive', () => {
    const md =
      ':::trigger{label="Fire"}\n' +
      ':::wrapper{as="span"}\n' +
      'Run\n' +
      '::image{src="https://placehold.co/32"}\n' +
      ':::\n' +
      ':set[fired=true]\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const button = document.querySelector(
      '[data-testid="trigger-button"]'
    ) as HTMLButtonElement
    const wrapper = button.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement
    const image = wrapper.querySelector(
      '[data-testid="slideImage"]'
    ) as HTMLElement
    expect(button).toBeTruthy()
    expect(wrapper).toBeTruthy()
    expect(wrapper.textContent).toContain('Run')
    expect(image).toBeTruthy()
    const img = image.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://placehold.co/32')
    act(() => {
      button.click()
    })
    expect(useGameStore.getState().gameData.fired).toBe(true)
    expect(document.body.innerHTML).not.toContain(':::')
  })
})
