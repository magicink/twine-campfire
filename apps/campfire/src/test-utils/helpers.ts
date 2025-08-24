import type { Element } from 'hast'
import { useGameStore } from '@campfire/state/useGameStore'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useDeckStore } from '@campfire/state/useDeckStore'

export const samplePassage: Element = {
  type: 'element',
  tagName: 'tw-passagedata',
  properties: { pid: '1', name: 'Start' },
  children: [{ type: 'text', value: 'Hello world' }]
}

/**
 * Resets deck, story and game stores along with related side effects.
 */
export const resetStores = () => {
  useDeckStore.getState().reset()
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
  localStorage.clear()
  document.title = ''
}

/**
 * Returns the `className` string from an SVG element across environments.
 */
export const getSvgClassName = (svg: SVGElement) =>
  typeof svg.className === 'object' ? svg.className.baseVal : svg.className
