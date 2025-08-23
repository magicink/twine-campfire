import { describe, it, expect, spyOn } from 'bun:test'
import { buildKeyframes, runAnimation } from '@campfire/components/transition'

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

/**
 * Ensures flip animations apply a perspective to the parent element.
 */
describe('runAnimation', () => {
  it('adds perspective for flip transitions', () => {
    const parent = document.createElement('div')
    const child = document.createElement('div') as HTMLElement & {
      animate: (
        keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
        options?: number | KeyframeAnimationOptions
      ) => Animation
    }
    parent.appendChild(child)
    child.animate = () =>
      ({ finished: Promise.resolve() }) as unknown as Animation
    const animate = spyOn(child, 'animate')
    runAnimation(child, { type: 'flip' }, 'in')
    expect(parent.style.perspective).toBe('1000px')
    expect(animate).toHaveBeenCalled()
  })
})
