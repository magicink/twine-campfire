import { useGameStore } from '@/packages/use-game-store'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { isRange } from './directives/helpers'

interface ShowProps {
  /** Game data key to display */
  key?: string
  /** Optional key attribute when using data-* */
  'data-key'?: string
  /** Translation key to display */
  'data-i18n-key'?: string
  /** Namespace for the translation key */
  'data-i18n-ns'?: string
  /** Pluralization count for the translation */
  'data-i18n-count'?: number
}

/**
 * Displays a value from the game store or a translated string for the
 * provided key. Returns `null` when the referenced value is `null` or
 * `undefined`. Updates automatically when the underlying data or translations
 * change.
 */
export const Show = (props: ShowProps) => {
  const { t } = useTranslation(
    typeof props['data-i18n-ns'] === 'string'
      ? props['data-i18n-ns']
      : undefined,
    { i18n: i18next }
  )
  const tKey = props['data-i18n-key']
  if (tKey) {
    const options: Record<string, unknown> = {}
    if (typeof props['data-i18n-ns'] === 'string')
      options.ns = props['data-i18n-ns']
    if (props['data-i18n-count'] !== undefined)
      options.count = props['data-i18n-count']
    return <span>{t(tKey, options)}</span>
  }
  const storeKey = props['data-key'] ?? props.key
  const value = useGameStore(state => {
    if (!storeKey) return undefined
    return (state.gameData as Record<string, unknown>)[storeKey]
  })
  if (value == null) return null
  const displayValue = isRange(value) ? value.value : value
  return <span>{String(displayValue)}</span>
}
