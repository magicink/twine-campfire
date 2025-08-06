import type { Element } from 'hast'
import { useGameStore } from '@/packages/use-game-store'
import { useStoryDataStore } from '@/packages/use-story-data-store'

export const samplePassage: Element = {
  type: 'element',
  tagName: 'tw-passagedata',
  properties: { pid: '1', name: 'Start' },
  children: [{ type: 'text', value: 'Hello world' }]
}

/**
 * Resets story and game stores along with related side effects.
 */
export const resetStores = () => {
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
