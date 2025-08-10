import { useEffect, useRef } from 'react'
import { useSerializedDirectiveRunner } from './useSerializedDirectiveRunner'

/** Props for the `OnExit` component. */
interface OnExitProps {
  /** Serialized content to run when exiting a passage */
  content: string
}

/**
 * Executes serialized directive content once when unmounted.
 *
 * @param content - Serialized directive block to process on exit.
 */
export const OnExit = ({ content }: OnExitProps) => {
  const run = useSerializedDirectiveRunner(content)
  const cleanupRanRef = useRef(false)
  const generationRef = useRef(0)

  useEffect(() => {
    generationRef.current++
    cleanupRanRef.current = false
    return () => {
      const current = generationRef.current
      queueMicrotask(() => {
        if (generationRef.current === current && !cleanupRanRef.current) {
          run()
          cleanupRanRef.current = true
        }
      })
    }
  }, [run])

  return null
}
