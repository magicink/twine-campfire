import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { SlideReveal } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { StubAnimation } from '@campfire/test-utils/stub-animation'
import { setupResizeObserver } from '@campfire/test-utils/helpers'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

beforeEach(() => {
  setupResizeObserver()
  resetStore()
  document.body.innerHTML = ''
})

describe('SlideReveal', () => {
  it('includes the campfire-slide-reveal class', () => {
    render(
      <Deck>
        <Slide>
          <SlideReveal>Hello</SlideReveal>
        </Slide>
      </Deck>
    )
    const reveal = screen.getByTestId('slide-reveal')
    expect(reveal.className).toContain('campfire-slide-reveal')
  })

  it('toggles hidden class based on visible state', async () => {
    render(
      <Deck>
        <Slide>
          <SlideReveal at={1}>HiddenTest</SlideReveal>
        </Slide>
      </Deck>
    )
    // Initially hidden (step 0)
    const reveal = screen.queryByTestId('slide-reveal')
    expect(reveal).toBeNull()
    act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const visibleReveal = screen.getByTestId('slide-reveal')
    expect(visibleReveal.className).toContain('campfire-slide-reveal')
    expect(visibleReveal.className).not.toContain('hidden')
  })

  it.skip('toggles visibility at the configured steps', async () => {
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <SlideReveal at={1}>Hello</SlideReveal>
        </Slide>
      </Deck>
    )
    expect(screen.queryByText('Hello')).toBeNull()
    act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it.skip('runs exit animation and unmounts after completion', async () => {
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <SlideReveal exitAt={1}>Bye</SlideReveal>
        </Slide>
      </Deck>
    )
    expect(screen.getByText('Bye')).toBeTruthy()
    act(() => {
      useDeckStore.getState().next()
    })
    // Still mounted during animation
    expect(screen.getByText('Bye')).toBeTruthy()
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.queryByText('Bye')).toBeNull()
  })

  it.skip('shows final state immediately when jumping past reveal step', async () => {
    render(
      <Deck>
        <Slide>
          <SlideReveal at={2}>Skip</SlideReveal>
        </Slide>
      </Deck>
    )
    act(() => {
      useDeckStore.getState().goTo(0, 5)
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Skip')).toBeTruthy()
  })

  it.skip('unmounts visible elements and does not mount unseen ones on slide change', async () => {
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <SlideReveal at={0}>First</SlideReveal>
          <SlideReveal at={1}>Second</SlideReveal>
        </Slide>
        <Slide>
          <SlideReveal at={0}>Next</SlideReveal>
        </Slide>
      </Deck>
    )

    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.queryByText('Second')).toBeNull()

    act(() => {
      useDeckStore.getState().goTo(1, 0)
    })

    expect(screen.queryByText('Second')).toBeNull()
    expect(screen.getByText('First')).toBeTruthy()

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.queryByText('First')).toBeNull()
    expect(screen.queryByText('Second')).toBeNull()
  })

  it("uses the slide's transition for all SlideReveal children", async () => {
    const transition = await import('@campfire/components/transition')
    const spy = spyOn(transition, 'runAnimation').mockImplementation(
      () => new StubAnimation() as unknown as Animation
    )

    render(
      <Deck>
        <Slide transition={{ type: 'slide' }}>
          <SlideReveal at={1}>A</SlideReveal>
          <SlideReveal at={2}>B</SlideReveal>
        </Slide>
      </Deck>
    )

    await act(() => useDeckStore.getState().next())
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(spy.mock.calls.at(-1)?.[1]).toMatchObject({ type: 'slide' })

    spy.mockClear()
    await act(() => useDeckStore.getState().next())
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(spy.mock.calls.at(-1)?.[1]).toMatchObject({ type: 'slide' })

    spy.mockRestore()
  })
})
