import { afterEach, expect } from 'bun:test'
import { cleanup } from '@testing-library/preact'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
