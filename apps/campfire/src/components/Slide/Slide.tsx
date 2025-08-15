import { type ComponentChildren, type JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { useDeckStore } from '@campfire/use-deck-store'
import { useSerializedDirectiveRunner } from '@campfire/hooks/useSerializedDirectiveRunner'

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom'
export type Direction = 'left' | 'right' | 'up' | 'down'

export interface Transition {
  type: TransitionType
  dir?: Direction
  duration?: number
  delay?: number
  easing?: string
}

export type SlideTransition =
  | Transition
  | { enter?: Transition; exit?: Transition }

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
  const cleanupRanRef = useRef(false)
  const generationRef = useRef(0)

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
    if (!onExit) return
    generationRef.current++
    cleanupRanRef.current = false
    return () => {
      const current = generationRef.current
      queueMicrotask(() => {
        if (generationRef.current === current && !cleanupRanRef.current) {
          runExit()
          cleanupRanRef.current = true
        }
      })
    }
  }, [onExit, runExit])

  const bgClass =
    typeof background === 'string' ? background : 'bg-gray-100 dark:bg-gray-900'
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
      className={`relative w-full h-full overflow-hidden ${bgClass} ${className ?? ''}`}
      style={bgStyle}
      data-transition={transition ? JSON.stringify(transition) : undefined}
    >
      {children}
    </div>
  )
}
