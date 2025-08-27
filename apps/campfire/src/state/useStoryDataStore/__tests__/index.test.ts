import { describe, it, expect, beforeEach } from 'bun:test'
import { useStoryDataStore } from '../index'
import type { Element } from 'hast'

beforeEach(() => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
})

describe('useStoryDataStore', () => {
  it('stores passages and retrieves them', () => {
    const p1: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: []
    }
    const p2: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: []
    }

    useStoryDataStore.getState().setPassages([p1, p2])
    useStoryDataStore.getState().setCurrentPassage('1')

    const store = useStoryDataStore.getState()
    expect(store.passages.length).toBe(2)
    expect(store.getPassageById('1')?.properties?.name).toBe('Start')
    expect(store.getPassageByName('Second')?.properties?.pid).toBe('2')
    expect(store.getCurrentPassage()?.properties?.pid).toBe('1')
  })

  it('updates the current passage manually', () => {
    const p1: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: []
    }

    useStoryDataStore.getState().setPassages([p1])
    useStoryDataStore.getState().setCurrentPassage('1')
    expect(
      useStoryDataStore.getState().getCurrentPassage()?.properties?.name
    ).toBe('Start')
  })

  it('returns undefined when passage does not exist', () => {
    expect(
      useStoryDataStore.getState().getPassageById('missing')
    ).toBeUndefined()
    expect(
      useStoryDataStore.getState().getPassageByName('missing')
    ).toBeUndefined()
  })

  it('gets current passage by name if ID lookup fails', () => {
    const p: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: []
    }

    useStoryDataStore.getState().setPassages([p])
    useStoryDataStore.getState().setCurrentPassage('Start')
    expect(
      useStoryDataStore.getState().getCurrentPassage()?.properties?.pid
    ).toBe('1')
  })

  it('retrieves passages with numeric IDs', () => {
    const p: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: 1, name: 'Numeric' },
      children: []
    }

    useStoryDataStore.getState().setPassages([p])
    expect(
      useStoryDataStore.getState().getPassageById('1')?.properties?.name
    ).toBe('Numeric')
  })

  it('persists story data', () => {
    useStoryDataStore.getState().setStoryData({ foo: 'bar' })
    expect(useStoryDataStore.getState().storyData).toEqual({ foo: 'bar' })
  })
})
