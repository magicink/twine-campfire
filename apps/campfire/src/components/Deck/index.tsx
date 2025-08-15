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
import { useDeckStore } from '@campfire/state/useDeckStory'
import { useScale, type DeckSize } from '@campfire/hooks/useScale'
import {
  defaultTransition,
  prefersReducedMotion,
  runAnimation
} from '@campfire/components/transition'
import { type Transition, type SlideTransition } from './Slide'

export type ThemeTokens = Record<string, string | number>

export interface DeckProps {
  size?: DeckSize
  theme?: ThemeTokens
  children?: ComponentChildren
  className?: string
}

/**
 * Renders a presentation deck that enables slide navigation and scaling.
 *
 * @param props - Configuration options for the deck component.
 * @returns A deck element that renders the current slide.
 */
export const Deck = ({
  size = { width: 1920, height: 1080 },
  theme,
  children,
  className
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
  const next = useDeckStore(state => state.next)
  const prev = useDeckStore(state => state.prev)
  const goTo = useDeckStore(state => state.goTo)
  const setSlidesCount = useDeckStore(state => state.setSlidesCount)

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
    const t = hasTransition(slide.props) ? slide.props.transition : undefined
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
  }, [slides.length, setSlidesCount])

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

  return (
    <div
      ref={hostRef}
      className={`relative w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 ${className ?? ''}`}
      style={themeStyle}
    >
      <div
        ref={slideRef}
        style={{
          width: size.width,
          height: size.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center'
        }}
        className='absolute left-1/2 top-1/2'
        onClick={next}
      >
        {prevVNode}
        {currentVNode}
      </div>
    </div>
  )
}

export default Deck
