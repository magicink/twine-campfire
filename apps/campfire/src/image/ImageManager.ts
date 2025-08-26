export class ImageManager {
  private static instance: ImageManager
  private cache: Map<string, HTMLImageElement> = new Map()

  /**
   * Determines the base URL for resolving relative image paths.
   *
   * @returns The base URL string.
   */
  private getBaseUrl(): string {
    if (
      typeof window !== 'undefined' &&
      window.location?.origin &&
      window.location.origin !== 'null'
    ) {
      return window.location.origin
    }
    if (
      typeof document !== 'undefined' &&
      document.baseURI &&
      document.baseURI !== 'about:blank'
    ) {
      return document.baseURI
    }
    return 'http://localhost'
  }

  /**
   * Retrieves the singleton instance of the ImageManager.
   *
   * @returns The ImageManager instance.
   */
  static getInstance(): ImageManager {
    if (!this.instance) this.instance = new ImageManager()
    return this.instance
  }

  /**
   * Preloads an image and caches it by id.
   *
   * @param id - Unique identifier for the image.
   * @param src - Source URL of the image.
   * @returns A promise that resolves when the image is loaded.
   */
  load(id: string, src: string): Promise<void> {
    if (this.cache.has(id)) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.cache.set(id, img)
        resolve()
      }
      img.onerror = err => reject(err)
      try {
        img.src = new URL(src, this.getBaseUrl()).href
      } catch (err) {
        console.error(`Invalid image source: ${src}`, err)
        reject(err as Error)
        return
      }
    })
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
