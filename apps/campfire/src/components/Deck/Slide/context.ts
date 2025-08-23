import { createContext } from 'preact'
import type { Transition } from 'types'

/**
 * Context providing default transitions for SlideReveal components within a Slide.
 */
export interface SlideTransitionContextValue {
  /** Default transition used when SlideReveal lacks explicit enter transition. */
  enter?: Transition
  /** Default transition used when SlideReveal lacks explicit exit transition. */
  exit?: Transition
}

/**
 * Context used to share Slide transitions with descendant SlideReveal components.
 */
export const SlideTransitionContext =
  createContext<SlideTransitionContextValue>({})
