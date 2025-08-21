import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { useGameStore } from '@campfire/state/useGameStore'
import { evalExpression, getTranslationOptions } from '@campfire/utils/core'

interface TranslateProps {
  /** Translation key to display */
  'data-i18n-key'?: string
  /** Expression that resolves to a translation key */
  'data-i18n-expr'?: string
  /** Namespace for the translation key */
  'data-i18n-ns'?: string
  /** Pluralization count for the translation */
  'data-i18n-count'?: number
  /** Interpolation values for the translation */
  'data-i18n-vars'?: string
}

/**
 * Renders a translated string using i18next.
 * Returns `null` when the key is missing.
 */
export const Translate = (props: TranslateProps) => {
  const addError = useGameStore(state => state.addError)
  const gameData = useGameStore(state => state.gameData)
  const { t } = useTranslation(undefined, { i18n: i18next })
  let ns = props['data-i18n-ns']
  let tKey = props['data-i18n-key']
  const expr = props['data-i18n-expr']
  if (!tKey && expr) {
    try {
      const result = evalExpression(expr, gameData)
      if (typeof result === 'string') {
        if (!ns && result.includes(':')) {
          ;[ns, tKey] = result.split(':', 2)
        } else {
          tKey = result
        }
      } else {
        return null
      }
    } catch (error) {
      const msg = `Failed to evaluate translation expression: ${expr}`
      console.error(msg, error)
      addError(msg)
      return null
    }
  }
  if (!tKey) return null
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
    ...getTranslationOptions({ ns, count: props['data-i18n-count'] })
  }
  return <span data-testid='translate'>{t(tKey, options)}</span>
}

export default Translate
