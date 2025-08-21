import { describe, it, expect } from 'bun:test'
import {
  evalExpression,
  clearExpressionCache,
  getCompiledExpression
} from '@campfire/utils/core'

describe('evalExpression', () => {
  it('caches compiled expressions', () => {
    clearExpressionCache()
    const expr = 'a + b'
    const result1 = evalExpression(expr, { a: 1, b: 2 })
    expect(result1).toBe(3)
    const fn1 = getCompiledExpression(expr)!
    const result2 = evalExpression(expr, { a: 2, b: 2 })
    expect(result2).toBe(4)
    const fn2 = getCompiledExpression(expr)!
    expect(fn1).toBe(fn2)
  })
})
