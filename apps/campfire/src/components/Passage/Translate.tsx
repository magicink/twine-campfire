import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { useGameStore } from '@campfire/state/useGameStore'
import { getTranslationOptions } from '@campfire/utils/core'

interface TranslateProps {
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
 * Renders a translated string using i18next.
 * Returns `null` when the key is missing.
 */
export const Translate = (props: TranslateProps) => {
  const addError = useGameStore(state => state.addError)
  const { t } = useTranslation(
    typeof props['data-i18n-ns'] === 'string'
      ? props['data-i18n-ns']
      : undefined,
    { i18n: i18next }
  )
  const tKey = props['data-i18n-key']
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
    ...getTranslationOptions({
      ns: props['data-i18n-ns'],
      count: props['data-i18n-count']
    })
  }
  return <span data-testid='translate'>{t(tKey, options)}</span>
}

export default Translate
