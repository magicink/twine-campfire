import { useLayoutEffect, useRef, useState } from 'preact/hooks'

/**
 * Dimensions of the content to scale within the container.
 */
export interface DeckSize {
  width: number
  height: number
}

/**
 * Observes the container size and computes a scale factor that keeps the
 * content within the provided dimensions. Returns a ref to attach to the
 * container element and the current scale value.
 *
 * @param size - The natural width and height of the content.
 * @returns An object containing the `ref` and computed `scale` value.
 */
export const useScale = (size: DeckSize) => {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    if (!ref.current) return

    const el = ref.current
    const ro = new ResizeObserver(() => {
      const { clientWidth: cw, clientHeight: ch } = el
      const sx = cw / size.width
      const sy = ch / size.height
      const s = Math.max(0.01, Math.min(sx, sy))
      setScale(s)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [size.height, size.width])

  return { ref, scale } as const
}
