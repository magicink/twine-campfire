import { describe, it, expect, beforeEach } from 'bun:test'
import { extractStoryData } from '../lib'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import type { Root, Element } from 'hast'

const tree: Root = {
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'tw-storydata',
          properties: { name: 'My Story' },
          children: []
        }
      ]
    }
  ]
}

beforeEach(() => {
  useStoryDataStore.setState({ storyData: {}, translations: [] })
})

describe('extractStoryData', () => {
  it('returns the tw-storydata element if present', () => {
    const result = extractStoryData(tree)
    const firstChild = tree.children[0] as Element
    const nested = firstChild.children[0] as Element
    expect(result).toEqual(nested)
    expect(useStoryDataStore.getState().storyData).toEqual(nested.properties)
  })

  it('returns undefined when tw-storydata is not found', () => {
    const result = extractStoryData({ type: 'root', children: [] } as Root)
    expect(result).toBeUndefined()
    expect(useStoryDataStore.getState().storyData).toEqual({})
  })
})
