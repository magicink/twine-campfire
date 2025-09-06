import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ImageManager } from '@campfire/image/ImageManager'

let originalImage: typeof Image
let createdCount = 0
let lastSrc = ''

/**
 * Mock Image element for testing (async).
 */
class MockImage {
  onload: (() => void) | null = null
  onerror: ((err: unknown) => void) | null = null
  set src(value: string) {
    lastSrc = value
    createdCount += 1
    setTimeout(() => {
      if (value.includes('error')) {
        this.onerror?.(new Error('error'))
      } else {
        this.onload?.()
      }
    }, 0)
  }
}

beforeEach(() => {
  originalImage = (globalThis as unknown as { Image: typeof Image }).Image
  ;(globalThis as unknown as { Image: typeof Image }).Image =
    MockImage as unknown as typeof Image
  createdCount = 0
  lastSrc = ''
  ImageManager.getInstance().clear()
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

  it('dedupes concurrent loads', async () => {
    const manager = ImageManager.getInstance()
    const p1 = manager.load('logo', 'logo.png')
    const p2 = manager.load('logo', 'logo.png')
    const [img1, img2] = await Promise.all([p1, p2])
    expect(img1).toBe(img2)
    expect(createdCount).toBe(1)
  })

  it('clears cache entries', async () => {
    const manager = ImageManager.getInstance()
    await manager.load('logo', 'logo.png')
    manager.clear('logo')
    expect(manager.get('logo')).toBeUndefined()
    await manager.load('logo', 'logo.png')
    expect(createdCount).toBe(2)
  })

  it('clears all images', async () => {
    const manager = ImageManager.getInstance()
    await manager.load('a', 'a.png')
    await manager.load('b', 'b.png')
    manager.clear()
    expect(manager.get('a')).toBeUndefined()
    expect(manager.get('b')).toBeUndefined()
  })

  it('ignores in-flight loads when cleared', async () => {
    const manager = ImageManager.getInstance()
    const promise = manager.load('temp', 'temp.png')
    manager.clear('temp')
    await promise
    expect(manager.get('temp')).toBeUndefined()
  })
})
