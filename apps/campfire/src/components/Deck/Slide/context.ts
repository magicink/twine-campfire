import { createContext } from 'preact'
import type { Transition } from './types'

/**
 * Context providing default transitions for Appear components within a Slide.
 */
export interface SlideTransitionContextValue {
  /** Default transition used when Appear lacks explicit enter transition. */
  enter?: Transition
  /** Default transition used when Appear lacks explicit exit transition. */
  exit?: Transition
}

/**
 * Context used to share Slide transitions with descendant Appear components.
 */
export const SlideTransitionContext =
  createContext<SlideTransitionContextValue>({})
