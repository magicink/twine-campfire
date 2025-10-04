import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterAll, beforeAll } from 'bun:test'

type HappyDomWindow = typeof globalThis & {
  clearTimeout?: typeof globalThis.clearTimeout
  setTimeout?: typeof globalThis.setTimeout
}

/**
 * Ensures Happy DOM timers mirror the global timer implementations.
 */
const bindGlobalTimers = () => {
  const windowObject = globalThis.window as HappyDomWindow | undefined

  if (!windowObject) {
    return
  }

  if (
    typeof globalThis.setTimeout === 'function' &&
    windowObject.setTimeout !== globalThis.setTimeout
  ) {
    windowObject.setTimeout = globalThis.setTimeout.bind(globalThis)
  }

  if (
    typeof globalThis.clearTimeout === 'function' &&
    windowObject.clearTimeout !== globalThis.clearTimeout
  ) {
    windowObject.clearTimeout = globalThis.clearTimeout.bind(globalThis)
  }
}

/**
 * Registers Happy DOM with conservative navigation defaults for tests.
 */
const ensureRegistration = () => {
  if (!GlobalRegistrator.isRegistered) {
    GlobalRegistrator.register({
      settings: {
        disableCSSFileLoading: true,
        disableJavaScriptFileLoading: true,
        handleDisabledFileLoadingAsSuccess: true,
        navigation: {
          disableChildFrameNavigation: true,
          disableChildPageNavigation: true,
          disableFallbackToSetURL: true,
          disableMainFrameNavigation: true
        }
      }
    })
  }

  bindGlobalTimers()
}

ensureRegistration()

beforeAll(() => {
  ensureRegistration()
})

afterAll(async () => {
  if (GlobalRegistrator.isRegistered) {
    await GlobalRegistrator.unregister()
  }
})
