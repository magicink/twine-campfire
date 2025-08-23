import { type JSX } from 'preact'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks'
import { useSerializedDirectiveRunner } from '@campfire/hooks/useSerializedDirectiveRunner'
import { SlideTransitionContext } from './context'
import type { SlideProps } from '@campfire/types'

/**
 * Renders a presentation slide with optional transition metadata.
 *
 * @param props - Configuration options for the slide component.
 * @returns A slide element.
 */
export const Slide = ({
  transition,
  className,
  onEnter,
  onExit,
  children
}: SlideProps): JSX.Element => {
  const runEnter = useSerializedDirectiveRunner(onEnter ?? '[]')
  const runExit = useSerializedDirectiveRunner(onExit ?? '[]')
  const runExitRef = useRef(runExit)
  const onExitRef = useRef(onExit)

  const contextValue = useMemo(() => {
    if (!transition) return {}
    if ('type' in transition) {
      return { enter: transition, exit: transition }
    }
    return { enter: transition.enter, exit: transition.exit }
  }, [transition])

  useEffect(() => {
    runEnter()
    // Run once when the slide becomes active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runExitRef.current = runExit
    onExitRef.current = onExit
  }, [runExit, onExit])

  useLayoutEffect(() => {
    return () => {
      if (onExitRef.current) {
        runExitRef.current()
      }
    }
  }, [])

  return (
    <SlideTransitionContext.Provider value={contextValue}>
      <div
        className={`relative w-full h-full overflow-hidden ${className ?? ''}`}
        data-transition={transition ? JSON.stringify(transition) : undefined}
        data-testid='slide'
      >
        {children}
      </div>
    </SlideTransitionContext.Provider>
  )
}

export default Slide
