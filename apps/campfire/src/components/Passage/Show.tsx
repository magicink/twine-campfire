import type { ComponentType, JSX } from 'preact'
import { useGameStore } from '@campfire/state/useGameStore'
import { isRange } from '@campfire/utils/directiveUtils'
import {
  evalExpression,
  interpolateString,
  mergeClasses
} from '@campfire/utils/core'

interface ShowProps {
  /** Game data key to display */
  'data-key'?: string
  /** Expression to evaluate and display */
  'data-expr'?: string
  /** Element or component tag to render. */
  as?: keyof JSX.IntrinsicElements | ComponentType<any>
  /** Additional CSS classes for the rendered element. */
  className?: string | string[]
  /** Inline styles for the rendered element. */
  style?: string | JSX.CSSProperties
}

/**
 * Displays a value from the game store or the result of an expression.
 * Returns `null` when the referenced value is `null` or `undefined`.
 * When `as` is provided, wraps the output with the specified element and
 * applies `className` and `style`. Otherwise renders as a fragment.
 * Updates automatically when the underlying data changes.
 */
export const Show = ({ as: Tag, className, style, ...props }: ShowProps) => {
  const addError = useGameStore.use.addError()
  const gameData = useGameStore.use.gameData()
  const expr = props['data-expr']

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
      if (Tag) {
        return (
          <Tag
            className={mergeClasses('campfire-show', className)}
            style={mergedStyle}
            data-testid='show'
          >
            {String(display)}
          </Tag>
        )
      }
      return <>{String(display)}</>
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
  if (Tag) {
    return (
      <Tag
        className={mergeClasses('campfire-show', className)}
        style={mergedStyle}
        data-testid='show'
      >
        {String(displayValue)}
      </Tag>
    )
  }
  return <>{String(displayValue)}</>
}
