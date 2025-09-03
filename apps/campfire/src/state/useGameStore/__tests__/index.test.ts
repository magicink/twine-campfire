import { useGameStore, listSavedGames } from '../index'
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
  localStorage.clear()
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

  it('saves and loads checkpoints', () => {
    useGameStore.getState().setGameData({ health: 10 })
    useGameStore.getState().saveCheckpoint('cp1', {
      gameData: { ...useGameStore.getState().gameData },
      lockedKeys: { ...useGameStore.getState().lockedKeys },
      onceKeys: { ...useGameStore.getState().onceKeys },
      currentPassageId: '1',
      label: 'Start'
    })
    useGameStore.getState().setGameData({ health: 5 })
    const cp = useGameStore.getState().loadCheckpoint('cp1')
    expect(useGameStore.getState().gameData).toEqual({ health: 10 })
    expect(cp?.currentPassageId).toBe('1')
    expect(cp?.timestamp).toBeGreaterThan(0)
  })

  it('loads the existing checkpoint when no id is provided', () => {
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
    const cp = useGameStore.getState().loadCheckpoint()
    expect(useGameStore.getState().gameData).toEqual({ health: 5 })
    expect(cp?.label).toBe('Second')
  })

  it('logs and stores an error when loading a nonexistent checkpoint', () => {
    const errors: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    const cp = useGameStore.getState().loadCheckpoint('missing')
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

  it('lists saved games and skips malformed entries', () => {
    localStorage.clear()
    localStorage.setItem(
      'campfire.save.one',
      JSON.stringify({ label: 'One', currentPassageId: '1', timestamp: 1 })
    )
    localStorage.setItem(
      'campfire.save.two',
      JSON.stringify({ currentPassageId: '2' })
    )
    localStorage.setItem('campfire.save.bad', '{invalid')
    localStorage.setItem('other', JSON.stringify({ currentPassageId: '3' }))

    const saves = listSavedGames()
    expect(saves).toHaveLength(2)
    expect(saves).toEqual(
      expect.arrayContaining([
        {
          id: 'campfire.save.one',
          label: 'One',
          currentPassageId: '1',
          timestamp: 1
        },
        { id: 'campfire.save.two', currentPassageId: '2' }
      ])
    )
  })

  it('exposes listSavedGames globally for directive expressions', () => {
    expect((globalThis as { listSavedGames?: unknown }).listSavedGames).toBe(
      listSavedGames
    )
  })
})
