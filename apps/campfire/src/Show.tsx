import { useGameStore } from '@/packages/use-game-store'

interface ShowProps {
  /** Game data key to display */
  key?: string
  /** Optional key attribute when using data-* */
  'data-key'?: string
}

/**
 * Displays a value from the game store for the provided key.
 * Returns `null` when the referenced value is `null` or `undefined`.
 * Updates automatically when the underlying data changes.
 */
export const Show = (props: ShowProps) => {
  const storeKey = props['data-key'] ?? props.key
  const value = useGameStore(state => {
    if (!storeKey) return undefined
    return (state.gameData as Record<string, unknown>)[storeKey as string]
  })
  if (value == null) return null
  return <span>{String(value)}</span>
}
