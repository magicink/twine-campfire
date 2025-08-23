import { type ComponentChildren } from 'preact'

/** Transition type used by slides. */
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip'

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
  className?: string
  /** Serialized directive block to run when the slide becomes active. */
  onEnter?: string
  /** Serialized directive block to run when the slide unmounts. */
  onExit?: string
  children?: ComponentChildren
}
