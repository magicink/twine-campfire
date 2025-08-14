import { describe, it, expect, beforeEach } from 'bun:test'
import { render, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from '@campfire/components/Slide/Slide'
import { useDeckStore } from '@/packages/use-deck-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from '@campfire/test-utils/helpers'
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
  useDeckStore.setState({
    currentSlide: 0,
    currentStep: 0,
    maxSteps: 0,
    slidesCount: 0,
    stepsPerSlide: {}
  })
}

// Minimal ResizeObserver stub for the tests
class StubResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  // @ts-expect-error override for tests
  globalThis.ResizeObserver = StubResizeObserver
  resetDeckStore()
  resetStores()
  document.body.innerHTML = ''
})

describe('Slide directive hooks', () => {
  it('runs onEnter directive when slide becomes active', () => {
    const content = makeDirective(':set[entered=true]')
    render(
      <Deck>
        <Slide onEnter={content}>One</Slide>
      </Deck>
    )
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.entered).toBe(true)
  })

  it('runs onExit directive when slide unmounts', async () => {
    const exitContent = makeDirective(':set[exited=true]')
    render(
      <Deck>
        <Slide onExit={exitContent}>One</Slide>
        <Slide>Two</Slide>
      </Deck>
    )
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).exited
    ).toBeUndefined()
    act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.exited).toBe(true)
  })
})
