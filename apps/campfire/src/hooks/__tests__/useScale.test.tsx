import { render, act } from '@testing-library/preact'
import { describe, it, expect } from 'bun:test'
import { useScale, MIN_SCALE } from '@campfire/hooks/useScale'

/**
 * Replaces the global ResizeObserver with a mock that allows manual
 * triggering of resize callbacks.
 *
 * @returns A function that invokes the stored resize callback.
 */
const setupResizeObserver = () => {
  let callback: ResizeObserverCallback = () => {}
  class MockResizeObserver {
    constructor(cb: ResizeObserverCallback) {
      callback = cb
    }
    observe() {}
    disconnect() {}
  }
  // @ts-expect-error override for tests
  globalThis.ResizeObserver = MockResizeObserver
  return () => callback([], {} as ResizeObserver)
}

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
})
