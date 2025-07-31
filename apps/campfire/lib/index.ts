import { visit, EXIT } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import { fromDom } from 'hast-util-from-dom'
import { useStoryDataStore } from '@/packages/use-story-data-store'

export function extractPassages(tree: Root): Element[] {
  const passages: Element[] = []
  visit(tree, 'element', node => {
    if (node.tagName === 'tw-passagedata') {
      passages.push(node as Element)
    }
  })
  useStoryDataStore.getState().setPassages(passages)
  return passages
}

export function extractStoryData(tree: Root): Element | undefined {
  let found: Element | undefined
  visit(tree, 'element', node => {
    if (node.type === 'element' && 'tagName' in node) {
      if (node.tagName === 'tw-storydata') {
        found = node as Element
        useStoryDataStore.getState().setStoryData(found.properties || {})
        return EXIT
      }
    }
  })
  return found
}

/**
 * Executes the contents of the <code>#twine-user-script</code> element.
 *
 * @warning This will run arbitrary JavaScript using the <code>Function</code>
 * constructor in the global scope. Only use this with trusted content.
 */
export function evaluateUserScript(
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) {
  if (!doc || typeof doc.getElementById !== 'function') return
  const el = doc.getElementById('twine-user-script') as HTMLScriptElement | null
  const code = el?.textContent
  if (!code) return
  // Using the Function constructor executes the code in the global scope.
  // eslint-disable-next-line no-new-func
  const fn = new Function(code)
  fn()
}

export function applyUserStyles(
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) {
  if (!doc || typeof doc.querySelector !== 'function') return
  const container = doc.querySelector('tw-storydata')
  const el = container?.querySelector(
    '#twine-user-stylesheet'
  ) as HTMLStyleElement | null
  const styles = el?.textContent
  if (!styles || !doc.head) return
  let styleEl = doc.head.querySelector(
    'style[data-twine-user-stylesheet]'
  ) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.setAttribute('data-twine-user-stylesheet', '')
    doc.head.appendChild(styleEl)
  }
  styleEl.textContent = styles
}

export function initialize(
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) {
  if (!doc || typeof doc.querySelector !== 'function') return
  const el = doc.querySelector('tw-storydata')
  if (!el) return
  const tree = fromDom(el)
  const story = extractStoryData(tree as Root)
  extractPassages(tree as Root)
  applyUserStyles(doc)
  evaluateUserScript(doc)
  const start = story?.properties?.startnode as string | undefined
  if (start) {
    useStoryDataStore.getState().setCurrentPassage(start)
  }
  return story
}
