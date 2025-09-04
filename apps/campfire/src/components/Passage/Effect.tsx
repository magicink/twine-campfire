import { useEffect, useMemo } from 'preact/hooks'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { shallow } from 'zustand/shallow'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useGameStore } from '@campfire/state/useGameStore'

const clone = rfdc()

/**
 * Props for the {@link Effect} component.
 */
interface EffectProps {
  /** State keys to watch for changes. */
  watch: string | string[]
  /** Serialized directive block to run. */
  content: string
}

/**
 * Runs directive content when specified state keys change.
 *
 * Executes once on mount and again whenever any watched key updates.
 *
 * @param watch - Array of top-level state keys to observe.
 * @param content - Serialized directive block executed on change.
 */
export const Effect = ({ watch, content }: EffectProps) => {
  const handlers = useDirectiveHandlers()
  const baseNodes = useMemo<RootContent[]>(() => JSON.parse(content), [content])

  useEffect(() => {
    const run = () => {
      runDirectiveBlock(clone(baseNodes) as RootContent[], handlers)
    }

    run()
    const keys = Array.isArray(watch)
      ? watch
      : String(watch ?? '')
          .split(/[\s,]+/)
          .filter(Boolean)
    const unsubscribe = (useGameStore.subscribe as any)(
      (state: any) =>
        keys.map(key => (state.gameData as Record<string, unknown>)[key]),
      (_: unknown, __: unknown) => queueMicrotask(run),
      { equalityFn: shallow }
    )
    return unsubscribe
  }, [handlers, baseNodes, watch])

  return null
}
