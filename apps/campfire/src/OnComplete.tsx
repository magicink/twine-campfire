import { useEffect, useRef } from 'preact/hooks'
import { useSerializedDirectiveRunner } from './useSerializedDirectiveRunner'

/** Props for the `OnComplete` component. */
export interface OnCompleteProps {
  /** Serialized content to run when the sequence completes */
  content: string
  /** Internal flag to trigger execution. Supplied by Sequence. */
  run?: boolean
}

/**
 * Executes serialized directive content when a sequence reaches its final step.
 * Only one instance should be used within a `Sequence`.
 *
 * @param content - Serialized directive block to process on completion.
 * @param run - Internal flag indicating when to execute.
 */
export const OnComplete = ({ content, run }: OnCompleteProps) => {
  const execute = useSerializedDirectiveRunner(content)
  const ranRef = useRef(false)

  useEffect(() => {
    if (run === undefined) {
      console.error('OnComplete must be used within a Sequence')
    }
  }, [run])

  useEffect(() => {
    if (run) {
      if (!ranRef.current) {
        execute()
        ranRef.current = true
      }
    } else {
      ranRef.current = false
    }
  }, [run, execute])

  return null
}
