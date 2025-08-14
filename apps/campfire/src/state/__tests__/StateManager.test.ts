import { beforeEach, describe, expect, it } from 'bun:test'
import { createStateManager } from '@campfire/state/stateManager'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('StateManager', () => {
  beforeEach(() => {
    resetStores()
  })

  it('gets and sets nested values', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setValue('player.hp', 5)
    expect(manager.getValue('player.hp')).toBe(5)
    expect(useGameStore.getState().gameData).toEqual({ player: { hp: 5 } })
  })

  it('unsets values and checks existence', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setValue('item', 'sword')
    expect(manager.hasValue('item')).toBe(true)
    manager.unsetValue('item')
    expect(manager.hasValue('item')).toBe(false)
  })

  it('locks values', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setValue('hp', 5, { lock: true })
    manager.setValue('hp', 10)
    expect(useGameStore.getState().gameData.hp).toBe(5)
  })

  it('marks once values', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.markOnce('intro')
    expect(useGameStore.getState().onceKeys.intro).toBe(true)
  })

  it('creates scoped manager and applies changes', () => {
    const manager = createStateManager<Record<string, unknown>>()
    const scoped = manager.createScope()
    scoped.setValue('hp', 3)
    expect(useGameStore.getState().gameData.hp).toBeUndefined()
    const changes = scoped.getChanges()
    manager.applyChanges(changes)
    expect(useGameStore.getState().gameData.hp).toBe(3)
  })

  it('tracks modified keys', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setValue('x', 1)
    manager.unsetValue('x')
    expect(manager.getModifiedKeys()).toContain('x')
  })

  it('handles range values', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setRange('hp', 0, 10, 20)
    expect(manager.getValue('hp')).toEqual({ min: 0, max: 10, value: 10 })
  })

  it('avoids updates when range value is unchanged', () => {
    const manager = createStateManager<Record<string, unknown>>()
    manager.setRange('hp', 0, 10, 5)
    const initial = useGameStore.getState().gameData.hp
    manager.setRange('hp', 0, 10, 5)
    expect(useGameStore.getState().gameData.hp).toBe(initial)
  })
})
