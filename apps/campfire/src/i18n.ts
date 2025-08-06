/**
 * Extracts translation options from directive attributes or component props.
 *
 * @param src - Source object that may contain `ns` and `count` values.
 * @returns Parsed i18next translation options.
 */
export const getTranslationOptions = (src: {
  ns?: unknown
  count?: unknown
}): { ns?: string; count?: number } => {
  const options: { ns?: string; count?: number } = {}
  if (typeof src.ns === 'string') options.ns = src.ns
  if (src.count !== undefined) {
    const n =
      typeof src.count === 'number' ? src.count : parseFloat(String(src.count))
    if (!Number.isNaN(n)) options.count = n
  }
  return options
}
