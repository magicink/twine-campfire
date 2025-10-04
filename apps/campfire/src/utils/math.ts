/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param n - The number to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max)

/**
 * Parses a value as a number, returning a default if parsing fails.
 *
 * @param value - The value to parse.
 * @param defaultValue - The value to return if parsing fails (default is 0).
 * @returns The parsed number or the default value.
 */
export const parseNumericValue = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') return value
  const num = parseFloat(String(value))
  return Number.isNaN(num) ? defaultValue : num
}

/** Range value representation */
export interface RangeValue {
  min: number
  max: number
  value: number
}

/**
 * Parses a value as a RangeValue object.
 * Accepts a string (JSON or numeric), number, or object.
 *
 * @param input - The value to parse.
 * @returns A RangeValue object.
 */
export const parseRange = (input: unknown): RangeValue => {
  let obj: unknown = input
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input)
    } catch {}
  }
  if (obj && typeof obj === 'object') {
    const data = obj as Record<string, unknown>
    const minRaw = data.min
    const maxRaw = data.max
    const min = typeof minRaw === 'number' ? minRaw : parseFloat(String(minRaw))
    const max = typeof maxRaw === 'number' ? maxRaw : parseFloat(String(maxRaw))
    const lo = Number.isNaN(min) ? 0 : min
    const hi = Number.isNaN(max) ? 0 : max
    const valRaw = data.value ?? lo
    const val = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw))
    return {
      min: lo,
      max: hi,
      value: clamp(Number.isNaN(val) ? 0 : val, lo, hi)
    }
  }
  const n = typeof obj === 'number' ? obj : parseFloat(String(obj))
  const num = Number.isNaN(n) ? 0 : n
  return { min: 0, max: num, value: clamp(num, 0, num) }
}

/**
 * Return a random integer between the two bounds, inclusive.
 * Math.random() generates a value in [0,1). Multiplying by the range size
 * (high - low + 1) allows the upper bound to be chosen, then we offset by the
 * lower bound.
 *
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer between the bounds.
 */
export const getRandomInt = (min: number, max: number): number => {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return Math.floor(Math.random() * (high - low + 1)) + low
}

/**
 * Returns a random item from the provided array, or undefined if the array is empty.
 *
 * @param items - The array of items to select from.
 * @returns A random item from the array, or undefined if the array is empty.
 */
export const getRandomItem = <T>(items: T[]): T | undefined => {
  if (!items.length) return undefined
  return items[getRandomInt(0, items.length - 1)]
}
