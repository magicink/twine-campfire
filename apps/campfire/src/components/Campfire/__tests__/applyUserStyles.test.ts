import { describe, it, expect, beforeEach } from 'bun:test'

import { applyUserStyles } from '@campfire/components/Campfire/applyUserStyles'

let doc: Document

beforeEach(() => {
  doc = document.implementation.createHTMLDocument('test')
})

describe('applyUserStyles', () => {
  it('applies styles when style tag is present', () => {
    const container = doc.createElement('tw-storydata')
    const style = doc.createElement('style')
    style.id = 'twine-user-stylesheet'
    style.textContent = 'body { color: red; }'
    container.appendChild(style)
    doc.body.appendChild(container)

    applyUserStyles(doc)
    const applied = doc.head.querySelector('style')
    expect(applied?.textContent).toBe('body { color: red; }')
  })

  it('does nothing when no style tag is found', () => {
    applyUserStyles(doc)
    expect(doc.head.querySelector('style')).toBeNull()
  })

  it('reuses the same style tag on subsequent calls', () => {
    const container = doc.createElement('tw-storydata')
    const style = doc.createElement('style')
    style.id = 'twine-user-stylesheet'
    style.textContent = 'body { color: red; }'
    container.appendChild(style)
    doc.body.appendChild(container)

    applyUserStyles(doc)
    const styleEl = doc.head.querySelector('style')!
    expect(styleEl.textContent).toBe('body { color: red; }')

    style.textContent = 'body { color: blue; }'
    applyUserStyles(doc)

    const styles = doc.head.querySelectorAll('style')
    expect(styles.length).toBe(1)
    expect(styles[0].textContent).toBe('body { color: blue; }')
  })
})
