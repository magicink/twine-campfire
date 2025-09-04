import { AssetManager } from '@campfire/utils/AssetManager'

/**
 * Manages image asset loading and caching.
 */
export class ImageManager extends AssetManager<HTMLImageElement> {
  /** Map of image ids to in-flight load promises. */
  private inFlight: Map<string, Promise<HTMLImageElement>> = new Map()

  /**
   * Preloads an image and caches it by id.
   *
   * @param id - Unique identifier for the image.
   * @param src - Source URL of the image.
   * @returns A promise resolving with the loaded image element.
   */
  load(id: string, src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(id)
    if (cached) return Promise.resolve(cached)
    const pending = this.inFlight.get(id)
    if (pending) return pending

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      const cleanup = () => {
        img.onload = null
        img.onerror = null
      }
      img.onload = () => {
        cleanup()
        resolve(img)
      }
      img.onerror = err => {
        cleanup()
        reject(err)
      }
      try {
        img.src = this.resolve(src)
      } catch (err) {
        cleanup()
        console.error(`Invalid image source: ${src}`, err)
        reject(err as Error)
        return
      }
    })

    const wrapped = promise
      .then(img => {
        if (this.inFlight.get(id) === wrapped) {
          this.cache.set(id, img)
          this.inFlight.delete(id)
        }
        return img
      })
      .catch(err => {
        if (this.inFlight.get(id) === wrapped) {
          this.inFlight.delete(id)
        }
        throw err
      })

    this.inFlight.set(id, wrapped)
    return wrapped
  }

  /**
   * Clears cached images.
   *
   * @param id - Optional identifier of the image to clear; clears all if omitted.
   */
  clear(id?: string): void {
    if (id) {
      this.cache.delete(id)
      this.inFlight.delete(id)
      return
    }
    this.cache.clear()
    this.inFlight.clear()
  }

  /**
   * Retrieves a cached image by id.
   *
   * @param id - Identifier of the image.
   * @returns The cached image element, if available.
   */
  get(id: string): HTMLImageElement | undefined {
    return this.cache.get(id)
  }
}
