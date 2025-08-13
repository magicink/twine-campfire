import type { ComponentChildren } from 'preact'

interface StepProps {
  /** Content or render function for the step */
  children:
    | ComponentChildren
    | ((controls: {
        next: () => void
        fastForward: () => void
      }) => ComponentChildren)
  /** Callback to advance to the next step. Supplied by Sequence. */
  next?: () => void
  /** Callback to fast-forward the sequence. Supplied by Sequence. */
  fastForward?: () => void
}

/**
 * Represents a single step within a {@link Sequence}.
 * The content can be static React nodes or a render function
 * receiving `next` and `fastForward` callbacks to control progression.
 */
export const Step = ({ children, next, fastForward }: StepProps) => {
  const content =
    typeof children === 'function'
      ? (
          children as (controls: {
            next: () => void
            fastForward: () => void
          }) => ComponentChildren
        )({
          next: next ?? (() => {}),
          fastForward: fastForward ?? (() => {})
        })
      : children

  return <>{content}</>
}

export type { StepProps }
