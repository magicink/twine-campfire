import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ImageManager } from '@campfire/image/ImageManager'

let originalImage: typeof Image
let createdCount = 0
let lastSrc = ''

/**
 * Mock Image element for testing.
 */
class MockImage {
  onload: (() => void) | null = null
  onerror: ((err: unknown) => void) | null = null
  set src(value: string) {
    lastSrc = value
    createdCount += 1
    if (value.includes('error')) {
      this.onerror?.(new Error('error'))
    } else {
      this.onload?.()
    }
  }
}

beforeEach(() => {
  originalImage = (globalThis as unknown as { Image: typeof Image }).Image
  ;(globalThis as unknown as { Image: typeof Image }).Image =
    MockImage as unknown as typeof Image
  createdCount = 0
  lastSrc = ''
})

afterEach(() => {
  ;(globalThis as unknown as { Image: typeof Image }).Image = originalImage
})

describe('ImageManager', () => {
  it('loads and caches images', async () => {
    const manager = ImageManager.getInstance()
    await manager.load('logo', 'logo.png')
    expect(manager.get('logo')).toBeDefined()
    expect(lastSrc).toContain('logo.png')
    await manager.load('logo', 'other.png')
    expect(createdCount).toBe(1)
  })

  it('rejects when image fails to load', async () => {
    const manager = ImageManager.getInstance()
    await expect(manager.load('bad', 'error.png')).rejects.toBeDefined()
  })
})
