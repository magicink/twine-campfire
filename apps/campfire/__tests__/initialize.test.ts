import { describe, it, expect, beforeEach } from 'bun:test'
import { initialize } from '../lib'
import { useStoryDataStore } from '@/packages/use-story-data-store'

let doc: Document

beforeEach(() => {
  doc = document.implementation.createHTMLDocument('test')
  useStoryDataStore.setState({ storyData: {}, translations: [] })
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

  it('applies user styles and runs user script', () => {
    const el = doc.createElement('tw-storydata')
    const style = doc.createElement('style')
    style.id = 'twine-user-stylesheet'
    style.textContent = 'body { color: green; }'
    el.appendChild(style)
    const script = doc.createElement('script')
    script.id = 'twine-user-script'
    script.textContent = 'globalThis.initTest = 99'
    el.appendChild(script)
    doc.body.appendChild(el)

    initialize(doc)

    const applied = doc.head.querySelector('style[data-twine-user-stylesheet]')
    expect(applied?.textContent).toBe('body { color: green; }')
    expect((globalThis as { initTest?: number }).initTest).toBe(99)

    delete (globalThis as { initTest?: number }).initTest
  })
})
