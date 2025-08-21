import { useGameStore } from '@campfire/state/useGameStore'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { isRange } from '@campfire/remark-campfire/helpers'
import { evalExpression, getTranslationOptions } from '@campfire/utils/core'

interface ShowProps {
  /** Game data key to display */
  'data-key'?: string
  /** Expression to evaluate and display */
  'data-expr'?: string
  /** Translation key to display */
  'data-i18n-key'?: string
  /** Namespace for the translation key */
  'data-i18n-ns'?: string
  /** Pluralization count for the translation */
  'data-i18n-count'?: number
  /** Interpolation values for the translation */
  'data-i18n-vars'?: string
}

/**
 * Displays a value from the game store or a translated string for the
 * provided key. Returns `null` when the referenced value is `null` or
 * `undefined`. Updates automatically when the underlying data or translations
 * change.
 */
export const Show = (props: ShowProps) => {
  const addError = useGameStore(state => state.addError)
  const gameData = useGameStore(state => state.gameData)
  const { t } = useTranslation(
    typeof props['data-i18n-ns'] === 'string'
      ? props['data-i18n-ns']
      : undefined,
    { i18n: i18next }
  )
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
  const tKey = props['data-i18n-key']
  if (tKey) {
    let vars: Record<string, unknown> = {}
    if (typeof props['data-i18n-vars'] === 'string') {
      try {
        vars = JSON.parse(props['data-i18n-vars']) as Record<string, unknown>
      } catch (error) {
        const msg = 'Invalid translation variables'
        console.error(msg, error)
        addError(msg)
        vars = {}
      }
    }
    const options = {
      ...vars,
      ...getTranslationOptions({
        ns: props['data-i18n-ns'],
        count: props['data-i18n-count']
      })
    }
    return <span data-testid='show'>{t(tKey, options)}</span>
  }
  const storeKey = props['data-key']
  const value = storeKey
    ? (gameData as Record<string, unknown>)[storeKey]
    : undefined
  if (value == null) return null
  const displayValue = isRange(value) ? value.value : value
  return <span data-testid='show'>{String(displayValue)}</span>
}
