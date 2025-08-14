import { type ComponentChildren, type JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDeckStore } from '@/packages/use-deck-store'

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
  /** Transition metadata consumed by Deck’s WAAPI wrapper. */
  transition?: SlideTransition
  /** Color classes or image background config. */
  background?:
    | string
    | { image: string; fit?: 'cover' | 'contain' | 'fill'; position?: string }
  className?: string
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
  children
}: SlideProps): JSX.Element => {
  const { maxSteps, setMaxSteps } = useDeckStore()

  useEffect(() => {
    if (typeof steps === 'number' && steps !== maxSteps) {
      setMaxSteps(steps)
    }
  }, [steps, maxSteps, setMaxSteps])

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
    >
      {children}
    </div>
  )
}
