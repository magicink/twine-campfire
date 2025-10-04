import { describe, it, expect, beforeEach, afterEach } from 'bun:test'

import { evaluateUserScript } from '@campfire/components/Campfire/evaluateUserScript'

/**
 * Removes the test marker from the global scope between runs.
 */
const clearUserTestFlag = () => {
  delete (globalThis as { userTest?: number }).userTest
}

beforeEach(() => {
  clearUserTestFlag()
})

afterEach(() => {
  clearUserTestFlag()
  const existing = document.getElementById('twine-user-script')
  existing?.remove()
})

describe('evaluateUserScript', () => {
  it('executes script when present', () => {
    const script = document.createElement('script')
    script.id = 'twine-user-script'
    script.textContent = 'globalThis.userTest = 42'
    document.body.append(script)
    evaluateUserScript(document)
    expect((globalThis as { userTest?: number }).userTest).toBe(42)
  })

  it('does nothing when no script is found', () => {
    evaluateUserScript(document)
    expect((globalThis as { userTest?: number }).userTest).toBeUndefined()
  })
})
