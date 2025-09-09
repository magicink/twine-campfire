import { getBaseUrl } from '@campfire/utils/core'

/**
 * Asset types supported by the manager. They either use the modern
 * `addEventListener` API or legacy `onload`/`onerror` handlers.
 */
type LoadableAsset =
  | {
      addEventListener(type: string, listener: EventListener): void
      removeEventListener(type: string, listener: EventListener): void
    }
  | {
      onload: ((ev: unknown) => void) | null
      onerror: ((ev: unknown) => void) | null
    }

/**
 * Type guard determining if an asset uses event listener methods.
 *
 * @param asset - Asset to check.
 * @returns Whether the asset supports `addEventListener`/`removeEventListener`.
 */
const hasEventListeners = (
  asset: LoadableAsset
): asset is {
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
} => 'addEventListener' in asset && 'removeEventListener' in asset

/**
 * Attaches load and error handlers to an asset.
 *
 * @param asset - Asset to attach listeners to.
 * @param loadEvent - Event name for a successful load.
 * @param onLoad - Callback for load completion.
 * @param errorEvent - Event name for load failure.
 * @param onError - Callback for load failure.
 * @returns A function that removes the listeners.
 */
const attachLoadListeners = (
  asset: LoadableAsset,
  loadEvent: string,
  onLoad: () => void,
  errorEvent: string,
  onError: (err: unknown) => void
): (() => void) => {
  if (hasEventListeners(asset)) {
    asset.addEventListener(loadEvent, onLoad)
    asset.addEventListener(errorEvent, onError)
    return () => {
      asset.removeEventListener(loadEvent, onLoad)
      asset.removeEventListener(errorEvent, onError)
    }
  }
  asset.onload = onLoad
  asset.onerror = onError
  return () => {
    asset.onload = null
    asset.onerror = null
  }
}

/**
 * Generic asset manager providing singleton access, caching, and URL resolution.
 *
 * @typeParam T - Type of asset handled by the manager.
 */
export abstract class AssetManager<T extends LoadableAsset> {
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
      let cleanup: () => void
      const onLoad = () => {
        cleanup()
        resolve(asset)
      }
      const onError = (err: unknown) => {
        cleanup()
        reject(err)
      }
      cleanup = attachLoadListeners(
        asset,
        loadEvent,
        onLoad,
        errorEvent,
        onError
      )
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
