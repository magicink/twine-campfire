import { useGameStore } from '../index'
import { describe, it, expect, beforeEach } from 'bun:test'

// Reset store state before each test
beforeEach(() => {
  useGameStore.setState({ gameData: {} })
  useGameStore.getState().init({})
})

describe('useGameStore', () => {
  it('merges partial game data and resets state', () => {
    expect(useGameStore.getState().gameData).toEqual({})

    useGameStore.getState().setGameData({ health: 100 })
    expect(useGameStore.getState().gameData).toEqual({ health: 100 })

    useGameStore.getState().setGameData({ mana: 50 })
    expect(useGameStore.getState().gameData).toEqual({ health: 100, mana: 50 })

    useGameStore.getState().reset()
    expect(useGameStore.getState().gameData).toEqual({})
  })

  it('initializes and resets to the provided state', () => {
    useGameStore.getState().init({ health: 10 })
    expect(useGameStore.getState().gameData).toEqual({ health: 10 })

    useGameStore.getState().setGameData({ mana: 5 })
    expect(useGameStore.getState().gameData).toEqual({ health: 10, mana: 5 })

    useGameStore.getState().reset()
    expect(useGameStore.getState().gameData).toEqual({ health: 10 })
  })

  it('unsets a key from the game data', () => {
    useGameStore.getState().setGameData({ health: 10, mana: 5 })
    useGameStore.getState().unsetGameData('mana')
    expect(useGameStore.getState().gameData).toEqual({ health: 10 })
  })
})
