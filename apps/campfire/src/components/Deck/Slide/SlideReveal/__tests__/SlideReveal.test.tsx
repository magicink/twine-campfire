import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { SlideReveal } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { StubAnimation } from '@campfire/test-utils/stub-animation'
import { resetStores, setupResizeObserver } from '@campfire/test-utils/helpers'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

/**
 * Serializes directive markdown into a JSON string of nodes.
 */
const makeDirective = (md: string) =>
  JSON.stringify(
    unified().use(remarkParse).use(remarkDirective).parse(md).children
  )

const originalAnimate = HTMLElement.prototype.animate

/**
 * Flushes pending animation microtasks to simulate completion.
 */
const flushAnimations = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  setupResizeObserver()
  resetStore()
  resetStores()
  document.body.innerHTML = ''
  HTMLElement.prototype.animate = () =>
    new StubAnimation() as unknown as Animation
})

afterEach(() => {
  HTMLElement.prototype.animate = originalAnimate
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
    await flushAnimations()
    const visibleReveal = screen.getByTestId('slide-reveal')
    expect(visibleReveal.className).toContain('campfire-slide-reveal')
    expect(visibleReveal.className).not.toContain('hidden')
  })

  it('applies custom className and style', () => {
    render(
      <Deck>
        <Slide>
          <SlideReveal className='extra' style={{ color: 'red' }}>
            Styled
          </SlideReveal>
        </Slide>
      </Deck>
    )
    const el = screen.getByTestId('slide-reveal')
    expect(el.className).toContain('campfire-slide-reveal')
    expect(el.className).toContain('extra')
    expect(el.style.color).toBe('red')
  })

  it('runs onEnter directive when becoming visible', async () => {
    const content = makeDirective('::set[entered=true]')
    render(
      <Deck>
        <Slide>
          <SlideReveal at={1} onEnter={content}>
            Hi
          </SlideReveal>
        </Slide>
      </Deck>
    )
    act(() => {
      useDeckStore.getState().next()
    })
    await flushAnimations()
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.entered).toBe(true)
  })

  it('toggles visibility at the configured steps', async () => {
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
    await flushAnimations()
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('runs exit animation and unmounts after completion', async () => {
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
    await flushAnimations()
    expect(screen.queryByText('Bye')).toBeNull()
  })

  it('shows final state immediately when jumping past reveal step', async () => {
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
    await flushAnimations()
    expect(screen.getByText('Skip')).toBeTruthy()
  })

  it('unmounts visible elements and does not mount unseen ones on slide change', async () => {
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

    await flushAnimations()

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
    await flushAnimations()
    expect(spy.mock.calls.at(-1)?.[1]).toMatchObject({ type: 'slide' })

    spy.mockClear()
    await act(() => useDeckStore.getState().next())
    await flushAnimations()
    expect(spy.mock.calls.at(-1)?.[1]).toMatchObject({ type: 'slide' })

    spy.mockRestore()
  })
})
