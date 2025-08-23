import { useCallback, useMemo } from 'preact/hooks'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { runBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { useGameStore } from '@campfire/state/useGameStore'

const clone = rfdc()

/**
 * Creates a runner for executing serialized directive content.
 *
 * @param content - Serialized directive block to execute.
 * @returns Function that runs the block with current game data.
 */
export const useSerializedDirectiveRunner = (content: string) => {
  const handlers = useDirectiveHandlers()
  const baseNodes = useMemo<RootContent[]>(() => JSON.parse(content), [content])

  const gameData = useGameStore(state => state.gameData)

  return useCallback(() => {
    runBlock(clone(baseNodes), gameData as Record<string, unknown>, handlers)
  }, [baseNodes, handlers, gameData])
}
