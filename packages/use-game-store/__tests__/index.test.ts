import { useGameStore } from '../index'
import { describe, it, expect, beforeEach } from 'bun:test'

// Reset store state before each test
beforeEach(() => {
  useGameStore.setState({
    gameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
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

  it('marks once keys and clears on reset', () => {
    useGameStore.getState().markOnce('intro')
    expect(useGameStore.getState().onceKeys).toEqual({ intro: true })
    useGameStore.getState().reset()
    expect(useGameStore.getState().onceKeys).toEqual({})
  })

  it('saves and restores checkpoints', () => {
    useGameStore.getState().setGameData({ health: 10 })
    useGameStore.getState().saveCheckpoint('cp1', {
      gameData: { ...useGameStore.getState().gameData },
      lockedKeys: { ...useGameStore.getState().lockedKeys },
      onceKeys: { ...useGameStore.getState().onceKeys },
      currentPassageId: '1',
      label: 'Start'
    })
    useGameStore.getState().setGameData({ health: 5 })
    const cp = useGameStore.getState().restoreCheckpoint('cp1')
    expect(useGameStore.getState().gameData).toEqual({ health: 10 })
    expect(cp?.currentPassageId).toBe('1')
    expect(cp?.timestamp).toBeGreaterThan(0)
  })

  it('restores the existing checkpoint when no id is provided', () => {
    useGameStore.getState().setGameData({ health: 10 })
    useGameStore.getState().saveCheckpoint('cp1', {
      gameData: { ...useGameStore.getState().gameData },
      lockedKeys: { ...useGameStore.getState().lockedKeys },
      onceKeys: { ...useGameStore.getState().onceKeys },
      currentPassageId: '1',
      label: 'First'
    })
    useGameStore.getState().setGameData({ health: 5 })
    useGameStore.getState().saveCheckpoint('cp2', {
      gameData: { ...useGameStore.getState().gameData },
      lockedKeys: { ...useGameStore.getState().lockedKeys },
      onceKeys: { ...useGameStore.getState().onceKeys },
      currentPassageId: '2',
      label: 'Second'
    })
    expect(useGameStore.getState().checkpoints.cp1).toBeUndefined()
    expect(useGameStore.getState().checkpoints.cp2).toBeDefined()
    useGameStore.getState().setGameData({ health: 1 })
    const cp = useGameStore.getState().restoreCheckpoint()
    expect(useGameStore.getState().gameData).toEqual({ health: 5 })
    expect(cp?.label).toBe('Second')
  })

  it('logs and stores an error when restoring a nonexistent checkpoint', () => {
    const errors: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    const cp = useGameStore.getState().restoreCheckpoint('missing')
    expect(cp).toBeUndefined()
    expect(errors).toHaveLength(1)
    expect(useGameStore.getState().errors).toEqual([
      'Checkpoint not found: missing'
    ])
    console.error = orig
  })

  it('clears recorded errors', () => {
    useGameStore.getState().addError('test')
    expect(useGameStore.getState().errors).toEqual(['test'])
    useGameStore.getState().clearErrors()
    expect(useGameStore.getState().errors).toEqual([])
  })
})
