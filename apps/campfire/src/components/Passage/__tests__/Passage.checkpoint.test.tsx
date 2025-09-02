import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage checkpoint directives', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('saves and loads game state with checkpoints', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::set[hp=5]\n:::\n:checkpoint{id="cp1"}'
        }
      ]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [
        {
          type: 'text',
          value: '::set[hp=1]\n:::\n:loadCheckpoint'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)
    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).hp).toBe(5)
    )

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '2' })
    })
    rerender(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(5)
      expect(useStoryDataStore.getState().currentPassageId).toBe('1')
    })
  })

  it('uses translated text as checkpoint label', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{translation:save="Save"}'
        },
        { type: 'text', value: ':checkpoint{id="cp1" label=save}' }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const cp = useGameStore.getState().checkpoints.cp1
      expect(cp?.label).toBe('Save')
    })
  })

  it('ignores checkpoint and loadCheckpoint directives in included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::set[hp=2]\n:::\n:checkpoint{id="cp1"}\n::include["Second"]'
        }
      ]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [
        {
          type: 'text',
          value: '::set[hp=1]\n:::\n:loadCheckpoint:checkpoint{id="cp2"}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(1)
      expect(useGameStore.getState().checkpoints.cp2).toBeUndefined()
      expect(useGameStore.getState().checkpoints.cp1).toBeDefined()
    })
  })

  it('stores error and creates no checkpoint when multiple checkpoints are in one passage', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkpoint{id="cp1"}::set[hp=1]\n:::\n:checkpoint{id="cp2"}'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(Object.keys(useGameStore.getState().checkpoints)).toHaveLength(0)
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Multiple checkpoints in a single passage are not allowed'
      ])
    })

    console.error = orig
  })

  it('saves game state and checkpoints to local storage', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::set[hp=5]\n:::\n:checkpoint{id="cp1"}:save{id="slot1"}'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() => {
      const raw = localStorage.getItem('slot1')
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw || '{}')
      expect(data.gameData.hp).toBe(5)
      expect(data.currentPassageId).toBe('1')
      expect(data.checkpoints.cp1).toBeDefined()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('loads game state and checkpoints from local storage', async () => {
    localStorage.setItem(
      'slot1',
      JSON.stringify({
        gameData: { hp: 7 },
        lockedKeys: {},
        onceKeys: {},
        checkpoints: {
          cp1: {
            gameData: { hp: 7 },
            lockedKeys: {},
            onceKeys: {},
            currentPassageId: '2',
            timestamp: 1
          }
        },
        currentPassageId: '2'
      })
    )
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':load{id="slot1"}' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(7)
      expect(useGameStore.getState().checkpoints.cp1).toBeDefined()
      expect(
        (useGameStore.getState().checkpoints.cp1?.gameData as any).hp
      ).toBe(7)
      expect(useStoryDataStore.getState().currentPassageId).toBe('2')
      expect(screen.getByText('Second text')).toBeInTheDocument()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('logs error when loaded state lacks current passage id', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    localStorage.setItem('slot1', JSON.stringify({ gameData: { hp: 7 } }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':load{id="slot1"}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(7)
      expect(useStoryDataStore.getState().currentPassageId).toBe('1')
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Saved game state has no current passage'
      ])
    })

    console.error = orig
  })

  it('clears a checkpoint', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkpoint{id="cp1"}:clearCheckpoint'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().checkpoints).toEqual({})
    })
  })

  it('clears a checkpoint from state', async () => {
    const state = useGameStore.getState()
    state.saveCheckpoint('cp1', {
      gameData: {},
      lockedKeys: {},
      onceKeys: {},
      currentPassageId: '1'
    })

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':clearCheckpoint' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().checkpoints).toEqual({})
    })
  })

  it('clears saved data from local storage', async () => {
    localStorage.setItem('slot1', 'test')

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':clearSave{id="slot1"}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(localStorage.getItem('slot1')).toBeNull()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('stores error when loadCheckpoint cannot find a checkpoint', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':loadCheckpoint' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual(['Checkpoint not found'])
    })

    console.error = orig
  })
})
