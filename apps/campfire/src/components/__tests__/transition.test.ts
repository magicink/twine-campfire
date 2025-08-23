import { describe, it, expect } from 'bun:test'
import { buildKeyframes } from '@campfire/components/transition'

/**
 * Verifies keyframes for the custom flip transition.
 */
describe('buildKeyframes', () => {
  it('supports the flip transition', () => {
    expect(buildKeyframes({ type: 'flip' }, 'in')).toEqual([
      { transform: 'rotateX(-90deg)', opacity: 0 },
      { transform: 'rotateX(0deg)', opacity: 1 }
    ])
    expect(buildKeyframes({ type: 'flip' }, 'out')).toEqual([
      { transform: 'rotateX(0deg)', opacity: 1 },
      { transform: 'rotateX(90deg)', opacity: 0 }
    ])
  })
})
