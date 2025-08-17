import {
  cloneElement,
  toChildArray,
  type ComponentChild,
  type ComponentChildren,
  type JSX,
  type VNode
} from 'preact'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'preact/hooks'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { useScale, type DeckSize } from '@campfire/hooks/useScale'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'
import {
  defaultTransition,
  prefersReducedMotion,
  runAnimation
} from '@campfire/components/transition'
import { type Transition, type SlideTransition } from './Slide'

export type ThemeTokens = Record<string, string | number>

/** Accessibility label strings and generators. */
export type A11yLabels = {
  /** aria-label for the deck region. */
  deck: string
  /** Label for the "next" control. */
  next: string
  /** Label for the "previous" control. */
  prev: string
  /** Label for the current slide. */
  slide: (index: number, total: number) => string
  /** Label for the step counter. */
  step: (current: number, total: number) => string
}

export interface DeckProps {
  size?: DeckSize
  theme?: ThemeTokens
  initialSlide?: number
  autoAdvanceMs?: number | null
  className?: string
  a11y?: Partial<A11yLabels>
  children?: ComponentChildren
}

/** Styles used to visually hide elements while remaining accessible. */
const srOnlyStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
}

/**
 * Renders a presentation deck that enables slide navigation and scaling.
 *
 * @param props - Configuration options for the deck component.
 * @returns A deck element that renders the current slide.
 */
export const Deck = ({
  size = { width: DEFAULT_DECK_WIDTH, height: DEFAULT_DECK_HEIGHT },
  theme,
  initialSlide,
  autoAdvanceMs,
  className,
  a11y,
  children
}: DeckProps) => {
  /**
   * Type guard to determine whether a child is a valid {@link VNode}.
   *
   * @param node - The child to test.
   * @returns True if the child is a {@link VNode}.
   */
  const isVNode = (node: ComponentChild): node is VNode =>
    typeof node === 'object' && node !== null && 'type' in node

  const slides = useMemo(
    () =>
      toChildArray(children).map((slide, index) =>
        isVNode(slide) ? cloneElement(slide, { key: index }) : slide
      ),
    [children]
  )
  const currentSlide = useDeckStore(state => state.currentSlide)
  const currentStep = useDeckStore(state => state.currentStep)
  const maxSteps = useDeckStore(state => state.maxSteps)
  const next = useDeckStore(state => state.next)
  const prev = useDeckStore(state => state.prev)
  const goTo = useDeckStore(state => state.goTo)
  const setSlidesCount = useDeckStore(state => state.setSlidesCount)
  const reset = useDeckStore(state => state.reset)

  const labels: A11yLabels = useMemo(
    () => ({
      deck: 'Presentation deck',
      next: 'Next slide',
      prev: 'Previous slide',
      slide: (index, total) => `Slide ${index} of ${total}`,
      step: (current, total) => `Step ${current} of ${total}`,
      ...(a11y ?? {})
    }),
    [a11y]
  )

  const [currentVNode, setCurrentVNode] = useState(slides[0] as VNode)
  const [prevVNode, setPrevVNode] = useState<VNode | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const reduceMotion = prefersReducedMotion()
  const firstRenderRef = useRef(true)

  /**
   * Type guard to determine whether props include a transition configuration.
   *
   * @param props - Props to test.
   * @returns True if the props contain a transition.
   */
  const hasTransition = (
    props: unknown
  ): props is { transition?: SlideTransition } =>
    typeof props === 'object' && props !== null && 'transition' in props

  /**
   * Retrieves the transition configuration for a slide and mode.
   *
   * @param slide - Slide vnode.
   * @param mode - Whether the slide is entering or exiting.
   * @returns Transition configuration.
   */
  const getTransition = (slide: VNode, mode: 'enter' | 'exit'): Transition => {
    const t = hasTransition(slide?.props) ? slide?.props?.transition : undefined
    if (!t) return defaultTransition
    if ('type' in t) return t
    return t[mode] ?? defaultTransition
  }

  useLayoutEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    const nextVNode = slides[currentSlide] as VNode
    setPrevVNode(currentVNode)
    setCurrentVNode(nextVNode)
  }, [currentSlide, slides])

  useLayoutEffect(() => {
    const container = slideRef.current
    if (!container) return
    const currentEl = container.lastElementChild as HTMLElement | null
    const prevEl = currentEl?.previousElementSibling as HTMLElement | null
    if (
      currentEl &&
      !(reduceMotion || getTransition(currentVNode, 'enter').type === 'none')
    ) {
      runAnimation(currentEl, getTransition(currentVNode, 'enter'), 'in')
    }
    if (prevVNode && prevEl) {
      if (reduceMotion || getTransition(prevVNode, 'exit').type === 'none') {
        setPrevVNode(null)
      } else {
        const anim = runAnimation(
          prevEl,
          getTransition(prevVNode, 'exit'),
          'out'
        )
        anim.finished.then(() => setPrevVNode(null))
      }
    }
  }, [currentVNode, prevVNode, reduceMotion])

  useEffect(() => {
    setSlidesCount(slides.length)
    if (typeof initialSlide === 'number') {
      goTo(initialSlide, 0)
    }
  }, [slides.length, setSlidesCount, initialSlide, goTo])

  useEffect(() => {
    if (autoAdvanceMs != null) {
      const id = setInterval(() => next(), autoAdvanceMs)
      return () => clearInterval(id)
    }
  }, [autoAdvanceMs, next])

  const { ref: hostRef, scale } = useScale(size)
  const themeStyle = useMemo(() => {
    const style: JSX.CSSProperties = {}
    if (theme) {
      for (const [k, v] of Object.entries(theme)) {
        ;(style as any)[k] = String(v)
      }
    }
    return style
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
      const typing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable
      if (typing) return

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ': {
          e.preventDefault()
          next()
          break
        }
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace': {
          e.preventDefault()
          prev()
          break
        }
        case 'Home': {
          e.preventDefault()
          goTo(0, 0)
          break
        }
        case 'End': {
          e.preventDefault()
          goTo(slides.length - 1, 0)
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, goTo, slides.length])

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return (
    <div
      ref={hostRef}
      className={`relative w-full h-full overflow-hidden bg-[var(--deck-bg,#0b0b0c)] ${
        className ?? ''
      }`}
      style={themeStyle}
      role='region'
      aria-roledescription='deck'
      aria-label={labels.deck}
      tabIndex={0}
      data-testid='deck'
    >
      <div
        ref={slideRef}
        className='absolute left-1/2 top-1/2'
        style={{
          width: size.width,
          height: size.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          background: 'var(--slide-bg, #111)',
          color: 'var(--slide-fg, #fff)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
        role='group'
        aria-roledescription='slide'
        aria-label={labels.slide(currentSlide + 1, slides.length)}
        onClick={next}
      >
        {prevVNode}
        {currentVNode}
      </div>
      <div aria-live='polite' aria-atomic='true' style={srOnlyStyle}>
        {labels.slide(currentSlide + 1, slides.length)}
      </div>
      {maxSteps > 0 && (
        <div aria-live='polite' aria-atomic='true' style={srOnlyStyle}>
          {labels.step(currentStep + 1, maxSteps)}
        </div>
      )}
      <div
        className='absolute bottom-3 left-1/2 -translate-x-1/2 text-sm px-2 py-1 rounded bg-black/50 text-white/80'
        aria-hidden='true'
        data-testid='deck-hud'
      >
        Slide {currentSlide + 1} / {slides.length}
        {maxSteps > 0 && (
          <span className='ml-2'>
            • Step {currentStep + 1} / {maxSteps}
          </span>
        )}
      </div>
      <div
        className='absolute inset-x-0 bottom-2 flex items-center justify-center px-2 pointer-events-none'
        style={{ gap: 8 }}
      >
        <button
          type='button'
          className='pointer-events-auto px-3 py-1 rounded bg-black/60 text-white/90 focus:outline-none focus:ring'
          aria-label={labels.prev}
          onClick={prev}
          data-testid='deck-prev'
        >
          ◀
        </button>
        <button
          type='button'
          className='pointer-events-auto px-3 py-1 rounded bg-black/60 text-white/90 focus:outline-none focus:ring'
          aria-label={labels.next}
          onClick={next}
          data-testid='deck-next'
        >
          ▶
        </button>
      </div>
    </div>
  )
}

export default Deck
