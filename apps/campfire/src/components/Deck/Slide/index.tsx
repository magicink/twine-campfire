import { type ComponentChildren, type JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { useDeckStore } from '@campfire/state/useDeckStory'
import { useSerializedDirectiveRunner } from '@campfire/hooks/useSerializedDirectiveRunner'

/** Transition type used by slides. */
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom'
/** Direction for slide transitions. */
export type Direction = 'left' | 'right' | 'up' | 'down'

/**
 * Describes a single transition configuration.
 */
export interface Transition {
  type: TransitionType
  dir?: Direction
  duration?: number
  delay?: number
  easing?: string
}

/**
 * Allows specifying separate enter and exit transitions.
 */
export type SlideTransition =
  | Transition
  | { enter?: Transition; exit?: Transition }

/** Properties accepted by the {@link Slide} component. */
export interface SlideProps {
  /** Optional build steps on this slide (used by the Deck store when active). */
  steps?: number
  /**
   * Transition metadata consumed by Deck’s WAAPI wrapper and exposed via the
   * `data-transition` attribute.
   */
  transition?: SlideTransition
  /** Color classes or image background config. */
  background?:
    | string
    | { image: string; fit?: 'cover' | 'contain' | 'fill'; position?: string }
  className?: string
  /** Serialized directive block to run when the slide becomes active. */
  onEnter?: string
  /** Serialized directive block to run when the slide unmounts. */
  onExit?: string
  children?: ComponentChildren
}

/**
 * Renders a presentation slide with optional background and transition metadata.
 *
 * @param props - Configuration options for the slide component.
 * @returns A slide element.
 */
export const Slide = ({
  steps,
  transition,
  background,
  className,
  onEnter,
  onExit,
  children
}: SlideProps): JSX.Element => {
  const maxSteps = useDeckStore(state => state.maxSteps)
  const setMaxSteps = useDeckStore(state => state.setMaxSteps)
  const runEnter = useSerializedDirectiveRunner(onEnter ?? '[]')
  const runExit = useSerializedDirectiveRunner(onExit ?? '[]')
  const runExitRef = useRef(runExit)
  const onExitRef = useRef(onExit)

  useEffect(() => {
    if (typeof steps === 'number' && steps !== maxSteps) {
      setMaxSteps(steps)
    }
  }, [steps, maxSteps, setMaxSteps])

  useEffect(() => {
    runEnter()
    // Run once when the slide becomes active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runExitRef.current = runExit
    onExitRef.current = onExit
  }, [runExit, onExit])

  useEffect(() => {
    return () => {
      if (onExitRef.current) {
        runExitRef.current()
      }
    }
  }, [])

  const bgClass = typeof background === 'string' ? background : ''
  const bgStyle: JSX.CSSProperties =
    typeof background === 'object'
      ? {
          backgroundImage: `url(${background.image})`,
          backgroundSize: background.fit ?? 'cover',
          backgroundPosition: background.position ?? 'center',
          backgroundRepeat: 'no-repeat'
        }
      : {}

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${bgClass} ${
        className ?? ''
      }`}
      style={bgStyle}
      data-transition={transition ? JSON.stringify(transition) : undefined}
      data-testid='slide'
    >
      {children}
    </div>
  )
}

export default Slide

export { Appear } from './Appear'
export { DeckText } from './DeckText'
export { Layer } from './Layer'
export type { LayerProps } from './Layer'
export { renderDirectiveMarkdown } from './renderDirectiveMarkdown'
