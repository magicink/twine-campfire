import { describe, it, expect, beforeEach } from 'bun:test'
import { initialize } from '../lib'
import { useStoryDataStore } from '@/packages/use-story-data-store'

let doc: Document

beforeEach(() => {
  doc = document.implementation.createHTMLDocument('test')
  useStoryDataStore.setState({ storyData: {} })
})

describe('initialize', () => {
  it('extracts story data from the DOM', () => {
    const el = doc.createElement('tw-storydata')
    el.setAttribute('name', 'Init Story')
    doc.body.appendChild(el)

    const result = initialize(doc)
    expect(result).not.toBeUndefined()
    expect(useStoryDataStore.getState().storyData).toEqual({
      name: 'Init Story'
    })
  })

  it('does nothing when no story data element is found', () => {
    const result = initialize(doc)
    expect(result).toBeUndefined()
    expect(useStoryDataStore.getState().storyData).toEqual({})
  })
})
