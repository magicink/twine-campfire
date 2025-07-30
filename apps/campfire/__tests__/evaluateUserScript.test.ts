import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { evaluateUserScript } from '../lib'

let mockDoc: Pick<Document, 'getElementById'>

beforeEach(() => {
  mockDoc = {
    getElementById: () => null
  }
  // ensure global variable cleared
  delete (globalThis as { userTest?: number }).userTest
})

afterEach(() => {
  delete (globalThis as { userTest?: number }).userTest
})

describe('evaluateUserScript', () => {
  it('executes script when present', () => {
    mockDoc.getElementById = () =>
      ({
        textContent: 'globalThis.userTest = 42'
      }) as unknown as HTMLScriptElement
    evaluateUserScript(mockDoc as unknown as Document)
    expect((globalThis as { userTest?: number }).userTest).toBe(42)
  })

  it('does nothing when no script is found', () => {
    evaluateUserScript(mockDoc as unknown as Document)
    expect((globalThis as { userTest?: number }).userTest).toBeUndefined()
  })
})
