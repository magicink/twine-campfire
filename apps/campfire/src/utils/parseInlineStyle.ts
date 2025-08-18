import type { JSX } from 'preact'

/**
 * Converts a CSS style string into a JSX style object.
 *
 * Accepts either a style object or a semicolon-delimited string and
 * returns a normalized style object.
 *
 * @param style - Inline style object or string.
 * @returns Normalized style object.
 */
export const parseInlineStyle = (
  style: JSX.CSSProperties | string
): JSX.CSSProperties =>
  typeof style === 'string'
    ? Object.fromEntries(
        style
          .split(';')
          .filter(Boolean)
          .map((rule: string) => {
            const [prop, ...rest] = rule.split(':')
            const name = prop
              .trim()
              .replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
            return [name, rest.join(':').trim()]
          })
      )
    : { ...style }

export default parseInlineStyle
