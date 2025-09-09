import { getBaseUrl } from '@campfire/utils/core'

/**
 * Generic asset manager providing singleton access, caching, and URL resolution.
 *
 * @typeParam T - Type of asset handled by the manager.
 */
export abstract class AssetManager<T extends EventTarget> {
  private static instances = new Map<Function, AssetManager<any>>()

  /** Cache of loaded assets keyed by identifier. */
  protected cache: Map<string, T> = new Map()

  /** Map of in-flight load promises keyed by identifier. */
  protected inFlight: Map<string, Promise<T>> = new Map()

  // TODO(campfire): Consider adding cache controls (max size/TTL/clear)
  // and metrics for hit/miss to guide preloading strategies.

  /**
   * Retrieves the singleton instance for the derived manager.
   *
   * @returns The singleton instance of the manager.
   */
  static getInstance<TManager extends AssetManager<any>>(
    this: new () => TManager
  ): TManager {
    let instance = AssetManager.instances.get(this) as TManager | undefined
    if (!instance) {
      instance = new this()
      AssetManager.instances.set(this, instance)
    }
    return instance
  }

  /**
   * Resolves an asset source against the application base URL.
   *
   * @param src - Source string to resolve.
   * @returns Resolved absolute URL string.
   */
  protected resolve = (src: string): string => new URL(src, getBaseUrl()).href

  /**
   * Retrieves a cached asset or creates one using the provided factory.
   *
   * @param id - Cache key for the asset.
   * @param src - Optional source string for the asset.
   * @param factory - Factory creating the asset from a resolved URL.
   * @returns The cached or newly created asset, or undefined if resolution fails.
   */
  protected getOrCreate = (
    id: string,
    src: string | undefined,
    factory: (href: string) => T
  ): T | undefined => {
    let asset = this.cache.get(id)
    if (asset) return asset
    const ref = src ?? id
    if (!ref) return undefined
    let href: string
    try {
      href = this.resolve(ref)
    } catch {
      console.error(`Invalid asset source: ${ref}`)
      return undefined
    }
    asset = factory(href)
    this.cache.set(id, asset)
    return asset
  }

  /**
   * Loads an asset, caching the result and deduping concurrent requests.
   *
   * @param id - Cache key for the asset.
   * @param src - Source URL for the asset.
   * @param create - Factory creating a blank asset instance.
   * @param options - Load configuration.
   * @returns A promise resolving with the loaded asset.
   */
  protected load(
    id: string,
    src: string,
    create: () => T,
    {
      start,
      loadEvent,
      errorEvent = 'error'
    }: {
      /**
       * Starts the load process after listeners are attached.
       *
       * @param asset - The asset to start loading.
       * @param href - Resolved URL for the asset.
       */
      start: (asset: T, href: string) => void
      /** Event fired when the asset has loaded. */
      loadEvent: string
      /** Event fired when the asset fails to load. */
      errorEvent?: string
    }
  ): Promise<T> {
    const cached = this.cache.get(id)
    if (cached) return Promise.resolve(cached)
    const pending = this.inFlight.get(id)
    if (pending) return pending

    let href: string
    try {
      href = this.resolve(src)
    } catch (err) {
      return Promise.reject(err)
    }

    const asset = create()

    const promise = new Promise<T>((resolve, reject) => {
      const onLoad = () => {
        cleanup()
        resolve(asset)
      }
      const onError = (err: unknown) => {
        cleanup()
        reject(err)
      }
      const cleanup = () => {
        if ('addEventListener' in asset) {
          asset.removeEventListener(loadEvent, onLoad as EventListener)
          asset.removeEventListener(errorEvent, onError as EventListener)
        } else {
          ;(asset as unknown as { onload: null; onerror: null }).onload = null
          ;(asset as unknown as { onload: null; onerror: null }).onerror = null
        }
      }
      if ('addEventListener' in asset) {
        asset.addEventListener(loadEvent, onLoad as EventListener)
        asset.addEventListener(errorEvent, onError as EventListener)
      } else {
        ;(
          asset as unknown as { onload: typeof onLoad; onerror: typeof onError }
        ).onload = onLoad
        ;(
          asset as unknown as { onload: typeof onLoad; onerror: typeof onError }
        ).onerror = onError
      }
      try {
        start(asset, href)
      } catch (err) {
        cleanup()
        reject(err)
      }
    })

    let wrapped: Promise<T> = promise.then(result => {
      if (this.inFlight.get(id) === wrapped) this.cache.set(id, result)
      return result
    })
    wrapped = wrapped.finally(() => {
      if (this.inFlight.get(id) === wrapped) this.inFlight.delete(id)
    })

    this.inFlight.set(id, wrapped)
    return wrapped
  }
}

export default AssetManager
