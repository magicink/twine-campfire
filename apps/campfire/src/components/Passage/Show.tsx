import type { JSX } from 'preact'
import { useGameStore } from '@campfire/state/useGameStore'
import { isRange } from '@campfire/utils/directiveUtils'
import { evalExpression, interpolateString } from '@campfire/utils/core'

interface ShowProps {
  /** Game data key to display */
  'data-key'?: string
  /** Expression to evaluate and display */
  'data-expr'?: string
  /** Additional CSS classes for the span element. */
  className?: string | string[]
  /** Inline styles for the span element. */
  style?: string | JSX.CSSProperties
}

/**
 * Displays a value from the game store or the result of an expression.
 * Returns `null` when the referenced value is `null` or `undefined`.
 * Updates automatically when the underlying data changes.
 */
export const Show = ({ className, style, ...props }: ShowProps) => {
  const addError = useGameStore(state => state.addError)
  const gameData = useGameStore(state => state.gameData)
  const expr = props['data-expr']
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const mergedStyle =
    typeof style === 'string' ? style : style ? { ...style } : undefined
  if (expr) {
    try {
      let result: unknown
      if (expr.startsWith('`') && expr.endsWith('`')) {
        result = interpolateString(expr.slice(1, -1), gameData)
      } else {
        result = evalExpression(expr, gameData)
      }
      if (result == null) return null
      const display = isRange(result) ? result.value : result
      return (
        <span
          className={['campfire-show', ...classes].join(' ')}
          style={mergedStyle}
          data-testid='show'
        >
          {String(display)}
        </span>
      )
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
  return (
    <span
      className={['campfire-show', ...classes].join(' ')}
      style={mergedStyle}
      data-testid='show'
    >
      {String(displayValue)}
    </span>
  )
}
