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
  /** Stores the most recent scale to avoid redundant state updates. */
  const scaleRef = useRef(1)

  useLayoutEffect(() => {
    if (!ref.current) return

    const el = ref.current
    const ro = new ResizeObserver(() => {
      const { clientWidth: cw, clientHeight: ch } = el
      const sx = cw / size.width
      const sy = ch / size.height
      const sRaw = Math.min(sx, sy)
      /**
       * Skip easing when the container is taller than it is wide to prevent
       * excessive scaling and horizontal clipping. Otherwise, ease the scale
       * using a square root to avoid overly shrinking content.
       */
      const eased = sRaw < 1 && sy <= sx ? Math.sqrt(sRaw) : sRaw
      const s = Math.max(MIN_SCALE, eased)
      if (s !== scaleRef.current) {
        scaleRef.current = s
        setScale(s)
      }
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [size.height, size.width])

  return { ref, scale } as const
}
