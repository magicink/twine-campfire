import { compile } from 'expression-eval'

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

/**
 * Clears all cached compiled expressions. Primarily used for testing.
 */
export const clearExpressionCache = (): void => {
  cache.clear()
}
