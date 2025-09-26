import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { render, act } from '@testing-library/preact'
import type { LeafDirective } from 'mdast-util-directive'
import type { Parent } from 'mdast'
import { useOrientationController } from '@campfire/hooks/useOrientationController'
import {
  setAllowLandscape,
  toggleAllowLandscape
} from '@campfire/state/orientationState'
import { createNavigationHandlers } from '@campfire/hooks/handlers/navigationHandlers'
import type { DirectiveHandler } from '@campfire/remark-campfire'

interface TestScreenOrientation extends ScreenOrientation {
  lock: (orientation: string) => Promise<void>
  unlock: () => void
}

const noop = () => {}

/**
 * Mounts a component that initializes the orientation controller hook.
 */
const renderController = () => {
  /**
   * Minimal component that activates the orientation controller.
   */
  const TestComponent = () => {
    useOrientationController()
    return null
  }
  return render(<TestComponent />)
}

describe('useOrientationController', () => {
  let originalScreen: Screen | undefined
  let orientation: TestScreenOrientation

  beforeEach(() => {
    originalScreen = globalThis.screen
    orientation = {
      angle: 0,
      type: 'portrait-primary',
      lock: () => Promise.resolve(),
      unlock: noop,
      onchange: null,
      addEventListener:
        noop as unknown as ScreenOrientation['addEventListener'],
      removeEventListener:
        noop as unknown as ScreenOrientation['removeEventListener'],
      dispatchEvent: () => true
    } as TestScreenOrientation
    const screenMock = { orientation } as unknown as Screen
    Object.defineProperty(globalThis, 'screen', {
      configurable: true,
      value: screenMock
    })
    setAllowLandscape(false)
  })

  afterEach(() => {
    if (originalScreen) {
      Object.defineProperty(globalThis, 'screen', {
        configurable: true,
        value: originalScreen
      })
    } else {
      delete (globalThis as { screen?: Screen }).screen
    }
  })

  it('locks orientation to portrait on mount by default', () => {
    const lockSpy = spyOn(orientation, 'lock').mockResolvedValue()
    const unlockSpy = spyOn(orientation, 'unlock').mockImplementation(noop)

    const { unmount } = renderController()

    expect(lockSpy).toHaveBeenCalledWith('portrait')
    expect(unlockSpy).not.toHaveBeenCalled()

    unmount()
  })

  it('unlocks orientation when ::allowLandscape directive runs', () => {
    const lockSpy = spyOn(orientation, 'lock').mockResolvedValue()
    const unlockSpy = spyOn(orientation, 'unlock').mockImplementation(noop)

    const handlersRef = { current: {} as Record<string, DirectiveHandler> }
    const navigationHandlers = createNavigationHandlers({
      addError: noop,
      setCurrentPassage: noop,
      getPassageById: () => undefined,
      getPassageByName: () => undefined,
      getGameData: () => ({}),
      handlersRef,
      getIncludeDepth: () => 0,
      incrementIncludeDepth: noop,
      decrementIncludeDepth: noop,
      toggleAllowLandscape
    })

    const directive: LeafDirective = {
      type: 'leafDirective',
      name: 'allowLandscape',
      attributes: {},
      children: []
    }
    const parent: Parent = {
      type: 'root',
      children: [directive]
    }

    const { unmount } = renderController()

    lockSpy.mockClear()

    act(() => {
      navigationHandlers.allowLandscape(directive, parent, 0)
    })

    expect(unlockSpy).toHaveBeenCalled()
    expect(lockSpy).not.toHaveBeenCalled()

    unmount()
  })
})
