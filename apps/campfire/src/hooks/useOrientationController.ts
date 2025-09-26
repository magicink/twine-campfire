import { useEffect } from 'preact/hooks'
import {
  isLandscapeAllowed,
  subscribeAllowLandscape,
  setAllowLandscape
} from '@campfire/state/orientationState'

interface LegacyScreen extends Screen {
  lockOrientation?: (orientation: string) => unknown
  unlockOrientation?: () => unknown
}

interface ExtendedScreenOrientation {
  lock?: (orientation: string) => Promise<void>
  unlock?: () => void
}

interface OrientationControl {
  lock?: (orientation: string) => void
  unlock?: () => void
}

/**
 * Safely invokes a function and swallows promise rejections.
 *
 * @param fn - Function to execute.
 * @param args - Arguments to pass to the function.
 */
const safeInvoke = <T extends unknown[]>(
  fn: ((...args: T) => unknown) | undefined,
  ...args: T
) => {
  if (typeof fn !== 'function') return
  try {
    const result = fn(...args)
    if (
      result &&
      typeof (result as any).then === 'function' &&
      typeof (result as any).catch === 'function'
    ) {
      ;(result as Promise<unknown>).catch(() => {})
    }
  } catch {
    // ignore failures to avoid breaking unsupported browsers
  }
}

/**
 * Retrieves orientation lock/unlock helpers with graceful fallbacks.
 *
 * @returns Orientation control helpers when supported.
 */
const createOrientationControl = (): OrientationControl => {
  const screenObject = globalThis.screen as LegacyScreen | undefined
  if (!screenObject) return {}
  const orientation = screenObject.orientation as
    | ExtendedScreenOrientation
    | undefined
  const lockCandidate =
    orientation && typeof orientation.lock === 'function'
      ? orientation.lock.bind(orientation)
      : typeof screenObject.lockOrientation === 'function'
        ? screenObject.lockOrientation.bind(screenObject)
        : undefined
  const unlockCandidate =
    orientation && typeof orientation.unlock === 'function'
      ? orientation.unlock.bind(orientation)
      : typeof screenObject.unlockOrientation === 'function'
        ? screenObject.unlockOrientation.bind(screenObject)
        : undefined
  return {
    lock:
      lockCandidate &&
      ((value: string) => {
        safeInvoke(lockCandidate as (value: string) => unknown, value)
      }),
    unlock:
      unlockCandidate &&
      (() => {
        safeInvoke(unlockCandidate as () => unknown)
      })
  }
}

/**
 * Controls screen orientation by locking to portrait-mode on mount and toggling to
 * landscape when the corresponding directive flag is set.
 */
export const useOrientationController = () => {
  useEffect(() => {
    const control = createOrientationControl()
    const applyOrientation = (allow: boolean) => {
      if (allow) {
        if (control.unlock) {
          control.unlock()
        } else {
          control.lock?.('landscape')
        }
      } else {
        control.lock?.('portrait')
      }
    }

    // Default to portrait lock on mount.
    applyOrientation(false)

    if (isLandscapeAllowed()) {
      applyOrientation(true)
    }

    const unsubscribe = subscribeAllowLandscape(applyOrientation)
    return () => {
      unsubscribe()
      control.unlock?.()
      setAllowLandscape(false)
    }
  }, [])
}
