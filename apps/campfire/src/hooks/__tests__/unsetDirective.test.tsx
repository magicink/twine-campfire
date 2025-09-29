import { beforeEach, describe, expect, it } from 'bun:test'
import type { Root, Text } from 'mdast'
import type { ContainerDirective, LeafDirective } from 'mdast-util-directive'
import { createStateHandlers } from '@campfire/hooks/handlers/stateHandlers'
import { createStateManager } from '@campfire/state/stateManager'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('unset directive handler', () => {
  beforeEach(() => {
    resetStores()
  })

  const createContext = () => {
    const manager = createStateManager<Record<string, unknown>>()
    const errors: string[] = []
    let refreshCount = 0
    const ctx = {
      getState: () => manager,
      getGameData: () => useGameStore.getState().gameData,
      refreshState: () => {
        refreshCount += 1
      },
      addError: (msg: string) => {
        errors.push(msg)
      }
    }
    return { ctx, errors, getRefreshCount: () => refreshCount }
  }

  it('rejects non-leaf unset directives', () => {
    const { ctx, errors } = createContext()
    const { handlers } = createStateHandlers(ctx)
    const directive: ContainerDirective = {
      type: 'containerDirective',
      name: 'unset',
      attributes: {},
      children: [],
      data: {}
    }
    const parent: Root = { type: 'root', children: [directive] }

    const result = handlers.unset(directive, parent, 0)

    expect(result).toBe(0)
    expect(parent.children).toHaveLength(0)
    expect(errors).toContain('unset can only be used as a leaf directive')
  })

  it('derives keys from directive labels when attributes are missing', () => {
    const { ctx, getRefreshCount } = createContext()
    const { handlers, setValue } = createStateHandlers(ctx)
    setValue('inventory.weapon', 'sword')
    const before = getRefreshCount()

    const directive: LeafDirective = {
      type: 'leafDirective',
      name: 'unset',
      attributes: {},
      children: [],
      data: {},
      label: 'inventory.weapon'
    }
    const parent: Root = { type: 'root', children: [directive] }

    const result = handlers.unset(directive, parent, 0)

    expect(result).toBe(0)
    expect(useGameStore.getState().gameData.inventory).toEqual({})
    expect(getRefreshCount()).toBe(before + 1)
  })

  it('falls back to directive text content for key derivation', () => {
    const { ctx, getRefreshCount } = createContext()
    const { handlers, setValue } = createStateHandlers(ctx)
    setValue('player.hp', 10)
    const before = getRefreshCount()

    const directive: LeafDirective = {
      type: 'leafDirective',
      name: 'unset',
      attributes: {},
      children: [
        {
          type: 'text',
          value: 'player.hp'
        } as Text
      ],
      data: {}
    }
    const parent: Root = { type: 'root', children: [directive] }

    const result = handlers.unset(directive, parent, 0)

    expect(result).toBe(0)
    expect(useGameStore.getState().gameData.player).toEqual({})
    expect(getRefreshCount()).toBe(before + 1)
  })
})
