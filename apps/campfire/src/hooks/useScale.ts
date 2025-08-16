import { useLayoutEffect, useRef, useState } from 'preact/hooks'

/**
 * Minimum allowed scale factor to ensure content remains visible.
 */
export const MIN_SCALE = 0.01

/**
 * Dimensions of the content to scale within the container.
 */
export interface DeckSize {
  width: number
  height: number
}

/**
 * Observes the container size and computes a scale factor that keeps the
 * content within the provided dimensions. When the container is smaller than
 * the content, the scale factor is eased using a square root to avoid
 * aggressively shrinking text. Returns a ref to attach to the container element
 * and the current scale value.
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
      const sRaw = Math.min(sx, sy)
      const s = Math.max(MIN_SCALE, sRaw < 1 ? Math.sqrt(sRaw) : sRaw)
      setScale(s)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [size.height, size.width])

  return { ref, scale } as const
}
