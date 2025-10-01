import { compile } from 'expression-eval'
import type { Content, Text as HastText } from 'hast'
import type { JSX } from 'preact'

/**
 * Queues a callback to run after the current call stack, preferring microtasks.
 *
 * Falls back to `setTimeout` when `queueMicrotask` is unavailable so tasks still
 * execute asynchronously in older environments.
 *
 * @param callback - Function to execute asynchronously.
 */
export const queueTask = (callback: () => void): void => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
  } else {
    setTimeout(callback, 0)
  }
}

/** Pattern matching a string enclosed in matching quotes or backticks. */
export const QUOTE_PATTERN = /^(['"`])(.*?)\1$/

/**
 * Extracts the inner content from a string wrapped in matching quotes or
 * backticks.
 *
 * @param value - Value to inspect for surrounding quotes.
 * @returns The unwrapped string when quoted, otherwise undefined.
 */
export const extractQuoted = (value: string): string | undefined => {
  const match = value.match(QUOTE_PATTERN)
  return match ? match[2] : undefined
}

/** Cache of compiled expressions keyed by their source string. */
const cache = new Map<string, (scope: Record<string, unknown>) => unknown>()

/**
 * Compiles and evaluates an expression with caching.
 *
 * @param expr - Expression to compile and evaluate.
 * @param scope - Scope object providing variables for evaluation.
 *                 Merged with `globalThis` so globally exposed helpers are
 *                 available; provided scope values take precedence.
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
  return fn({ ...(globalThis as Record<string, unknown>), ...scope })
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
 * Interpolates `${}` placeholders in a template string using the provided scope.
 *
 * @param template - String containing `${}` placeholders.
 * @param scope - Scope object supplying variables for interpolation.
 * @returns The interpolated string.
 */
export const interpolateString = (
  template: string,
  scope: Record<string, unknown> = {}
): string =>
  template.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    try {
      const value = evalExpression(expr, scope)
      const result =
        value &&
        typeof value === 'object' &&
        'value' in (value as Record<string, unknown>)
          ? (value as Record<string, unknown>).value
          : value
      return result != null ? String(result) : ''
    } catch {
      return ''
    }
  })

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
 * Merges multiple class name inputs into a deduplicated string.
 *
 * Accepts strings or arrays of strings and filters out falsy values and
 * duplicates.
 *
 * @param classes - Class name values to merge.
 * @returns A space-separated string of unique class names.
 */
export const mergeClasses = (
  ...classes: Array<string | string[] | undefined | null | false>
): string =>
  classes
    .flatMap(cls => (Array.isArray(cls) ? cls : cls ? [cls] : []))
    .filter((c, i, arr) => c && arr.indexOf(c) === i)
    .join(' ')

/**
 * Normalizes a disabled attribute to a boolean.
 *
 * Accepts string, boolean, or undefined values. When a string is provided,
 * empty strings and the literal `'true'` are treated as true, `'false'` as
 * false, and other strings are evaluated as expressions against the provided
 * scope.
 *
 * @param disabled - Attribute value to parse.
 * @param scope - Optional scope for expression evaluation.
 * @returns The resolved boolean value.
 */
export const parseDisabledAttr = (
  disabled: string | boolean | undefined,
  scope: Record<string, unknown> = {}
): boolean => {
  if (typeof disabled === 'string') {
    if (disabled === '' || disabled === 'true') return true
    if (disabled === 'false') return false
    try {
      return Boolean(evalExpression(disabled, scope))
    } catch {
      return false
    }
  }
  return Boolean(disabled)
}

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

/**
 * Determines the base URL for resolving relative asset paths.
 *
 * @returns The base URL string.
 */
export const getBaseUrl = (): string => {
  const origin = globalThis.window?.location?.origin
  if (origin && origin !== 'null') {
    return origin
  }
  const baseURI = globalThis.document?.baseURI
  if (baseURI && baseURI !== 'about:blank') {
    return baseURI
  }
  return 'http://localhost'
}

/**
 * Extracts concatenated text content from a collection of HAST child nodes.
 *
 * Only nodes with a `type` of `'text'` contribute to the output so the helper
 * mirrors existing passage processing behavior.
 *
 * @param children - Child nodes potentially containing text values.
 * @returns The joined text from all text nodes.
 */
export const getPassageText = (children: Content[]): string =>
  children
    .map(child =>
      child.type === 'text' && typeof (child as HastText).value === 'string'
        ? (child as HastText).value
        : ''
    )
    .join('')
