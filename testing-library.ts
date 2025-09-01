import { afterEach, expect, setDefaultTimeout } from 'bun:test'
import { cleanup } from '@testing-library/preact'
import * as matchers from '@testing-library/jest-dom/matchers'

/**
 * Sets a default timeout for all tests to avoid infinite loops.
 */
setDefaultTimeout(10_000)

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
