/**
 * Listener invoked when the landscape allowance flag changes.
 */
type OrientationListener = (allowLandscape: boolean) => void

/** Current state indicating whether landscape orientation is allowed. */
let allowLandscape = false

/** Registered orientation listeners notified on state changes. */
const listeners = new Set<OrientationListener>()

/**
 * Notifies all registered listeners of the current landscape allowance state.
 */
const notifyListeners = () => {
  for (const listener of listeners) {
    listener(allowLandscape)
  }
}

/**
 * Indicates whether landscape orientation is currently allowed.
 *
 * @returns True when landscape orientation is permitted.
 */
export const isLandscapeAllowed = () => allowLandscape

/**
 * Sets the landscape allowance flag to a specific value.
 *
 * @param value - Desired landscape allowance state.
 */
export const setAllowLandscape = (value: boolean) => {
  if (allowLandscape === value) return
  allowLandscape = value
  notifyListeners()
}

/**
 * Toggles the stored landscape allowance flag and notifies listeners.
 */
export const toggleAllowLandscape = () => {
  allowLandscape = !allowLandscape
  notifyListeners()
}

/**
 * Subscribes to landscape allowance changes.
 *
 * @param listener - Callback invoked with the updated allowance state.
 * @returns Cleanup function removing the listener.
 */
export const subscribeAllowLandscape = (listener: OrientationListener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
