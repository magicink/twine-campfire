import { render, act } from '@testing-library/preact'
import { describe, it, expect } from 'bun:test'
import { useScale, MIN_SCALE } from '@campfire/hooks/useScale'
import { setupResizeObserver } from '@campfire/test-utils/helpers'

describe('useScale', () => {
  it('updates scale when container size changes', () => {
    const trigger = setupResizeObserver()
    let currentScale = 0

    /**
     * Test component that exposes the scale computed by the hook.
     */
    const TestComponent = () => {
      const { ref, scale } = useScale({ width: 100, height: 100 })
      currentScale = scale
      return <div ref={ref} />
    }

    const { container } = render(<TestComponent />)
    const el = container.firstElementChild as HTMLDivElement

    Object.defineProperty(el, 'clientWidth', { value: 50, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 40, configurable: true })
    act(() => trigger())
    expect(currentScale).toBeCloseTo(Math.sqrt(0.4))

    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'clientHeight', {
      value: 300,
      configurable: true
    })
    act(() => trigger())
    expect(currentScale).toBe(2)
  })

  it('skips easing when container is taller than wide', () => {
    const trigger = setupResizeObserver()
    let currentScale = 0

    /**
     * Test component that exposes the scale computed by the hook.
     */
    const TestComponent = () => {
      const { ref, scale } = useScale({ width: 100, height: 100 })
      currentScale = scale
      return <div ref={ref} />
    }

    const { container } = render(<TestComponent />)
    const el = container.firstElementChild as HTMLDivElement

    Object.defineProperty(el, 'clientWidth', { value: 80, configurable: true })
    Object.defineProperty(el, 'clientHeight', {
      value: 200,
      configurable: true
    })
    act(() => trigger())
    expect(currentScale).toBe(0.8)
  })

  it('prevents scale from dropping below the minimum', () => {
    const trigger = setupResizeObserver()
    let currentScale = 1

    /**
     * Test component that uses a large base size to trigger minimum scale.
     */
    const TestComponent = () => {
      const { ref, scale } = useScale({ width: 1000, height: 1000 })
      currentScale = scale
      return <div ref={ref} />
    }

    const { container } = render(<TestComponent />)
    const el = container.firstElementChild as HTMLDivElement

    Object.defineProperty(el, 'clientWidth', { value: 0, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 0, configurable: true })
    act(() => trigger())
    expect(currentScale).toBe(MIN_SCALE)
  })

  it('does not update scale when size remains the same', () => {
    const trigger = setupResizeObserver()
    let renders = 0

    /** Test component that tracks render count. */
    const TestComponent = () => {
      const { ref, scale } = useScale({ width: 100, height: 100 })
      renders++
      return <div ref={ref} data-scale={scale} />
    }

    const { container } = render(<TestComponent />)
    const el = container.firstElementChild as HTMLDivElement

    Object.defineProperty(el, 'clientWidth', { value: 100, configurable: true })
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true
    })
    act(() => trigger())
    expect(renders).toBe(1)

    Object.defineProperty(el, 'clientWidth', { value: 80, configurable: true })
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true
    })
    act(() => trigger())
    expect(renders).toBe(2)
  })
})
