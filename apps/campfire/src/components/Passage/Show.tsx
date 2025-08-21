import { useGameStore } from '@campfire/state/useGameStore'
import { isRange } from '@campfire/remark-campfire/helpers'
import { evalExpression } from '@campfire/utils/core'

interface ShowProps {
  /** Game data key to display */
  'data-key'?: string
  /** Expression to evaluate and display */
  'data-expr'?: string
}

/**
 * Displays a value from the game store or the result of an expression.
 * Returns `null` when the referenced value is `null` or `undefined`.
 * Updates automatically when the underlying data changes.
 */
export const Show = (props: ShowProps) => {
  const addError = useGameStore(state => state.addError)
  const gameData = useGameStore(state => state.gameData)
  const expr = props['data-expr']
  if (expr) {
    try {
      const result = evalExpression(expr, gameData)
      if (result == null) return null
      const display = isRange(result) ? result.value : result
      return <span data-testid='show'>{String(display)}</span>
    } catch (error) {
      const msg = `Failed to evaluate show expression: ${expr}`
      console.error(msg, error)
      addError(msg)
      return null
    }
  }
  const storeKey = props['data-key']
  const value = storeKey
    ? (gameData as Record<string, unknown>)[storeKey]
    : undefined
  if (value == null) return null
  const displayValue = isRange(value) ? value.value : value
  return <span data-testid='show'>{String(displayValue)}</span>
}
