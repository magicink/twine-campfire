import { describe, it, expect, beforeEach } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Deck, Slide, TriggerButton } from '@campfire/components'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores, setupResizeObserver } from '@campfire/test-utils/helpers'
import { StubAnimation } from '@campfire/test-utils/stub-animation'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'

/**
 * Serializes directive markdown into a JSON string of nodes.
 */
const makeDirective = (md: string) =>
  JSON.stringify(
    unified().use(remarkParse).use(remarkDirective).parse(md).children
  )

/**
 * Resets deck store for each test.
 */
const resetDeckStore = () => {
  useDeckStore.getState().reset()
}

beforeEach(() => {
  setupResizeObserver()
  HTMLElement.prototype.animate = (() =>
    new StubAnimation()) as typeof HTMLElement.prototype.animate
  resetDeckStore()
  resetStores()
  document.body.innerHTML = ''
})

describe('Slide directive hooks', () => {
  it('runs onEnter directive when slide becomes active', () => {
    const content = makeDirective('::set[entered=true]')
    render(
      <Deck>
        <Slide onEnter={content}>One</Slide>
      </Deck>
    )
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.entered).toBe(true)
  })

  it('runs TriggerButton directives inside slides', () => {
    const btnContent = makeDirective('::set[clicked=true]')
    const { getByRole } = render(
      <Deck>
        <Slide>
          <TriggerButton content={btnContent}>Click</TriggerButton>
        </Slide>
      </Deck>
    )
    const button = getByRole('button', { name: 'Click' })
    fireEvent.click(button)
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.clicked).toBe(true)
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })
})
