import { compile } from 'expression-eval'
import type { JSX } from 'preact'

/** Pattern matching a string enclosed in matching quotes or backticks. */
export const QUOTE_PATTERN = /^(['"`])(.*)\1$/

/** Cache of compiled expressions keyed by their source string. */
const cache = new Map<string, (scope: Record<string, unknown>) => unknown>()

/**
 * Compiles and evaluates an expression with caching.
 *
 * @param expr - Expression to compile and evaluate.
 * @param scope - Scope object providing variables for evaluation.
 * @returns Result of the evaluated expression.
 */
export const evalExpression = (
  expr: string,
  scope: Record<string, unknown> = {}
): unknown => {
  let fn = cache.get(expr)
  if (!fn) {
    fn = compile(expr) as (scope: Record<string, unknown>) => unknown
    cache.set(expr, fn)
  }
  return fn(scope)
}

/**
 * Retrieves a cached compiled function for an expression, if available.
 *
 * @param expr - Expression whose compiled function is requested.
 * @returns The cached function or undefined when not cached.
 */
export const getCompiledExpression = (
  expr: string
): ((scope: Record<string, unknown>) => unknown) | undefined => cache.get(expr)

/** Clears all cached compiled expressions. Primarily used for testing. */
export const clearExpressionCache = (): void => {
  cache.clear()
}

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
