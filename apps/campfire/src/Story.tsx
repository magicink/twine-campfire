import { useEffect } from 'react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  type StoryDataState,
  useStoryDataStore
} from '@/packages/use-story-data-store'
import { Passage } from './Passage'
import { DebugWindow } from './DebugWindow'
import { fromDom } from 'hast-util-from-dom'
import type { Element, Root } from 'hast'
import { EXIT, visit } from 'unist-util-visit'

/**
 * Executes the contents of the <code>#twine-user-script</code> element.
 *
 * @warning This will run arbitrary JavaScript using the <code>Function</code>
 * constructor in the global scope. Only use this with trusted content.
 */
export const evaluateUserScript = (
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) => {
  if (!doc || typeof doc.getElementById !== 'function') return
  const el = doc.getElementById('twine-user-script') as HTMLScriptElement | null
  const code = el?.textContent
  if (!code) return
  // Using the Function constructor executes the code in the global scope.
  // eslint-disable-next-line no-new-func
  const fn = new Function(code)
  fn()
}

/**
 * Applies user-defined CSS styles from a <style> element with the ID 'twine-user-stylesheet' inside a 'tw-storydata' container
 * to the document's <head>. If the style element does not exist in <head>, it will be created.
 *
 * @param {Document | undefined} doc - The document to apply styles to. Defaults to the global document if available.
 */
export const applyUserStyles = (
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) => {
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

/**
 * React component that renders the main story interface.
 *
 * This component initializes story data, passages, user styles, and user scripts from a Twine-compatible document structure.
 * It manages the current passage and provides a debug window for development.
 *
 * @component
 */
export const Story = () => {
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const setPassages = useStoryDataStore(
    (state: StoryDataState) => state.setPassages
  )
  const setCurrentPassage = useStoryDataStore(
    (state: StoryDataState) => state.setCurrentPassage
  )
  const setStoryData = useStoryDataStore(
    (state: StoryDataState) => state.setStoryData
  )

  /**
   * Extracts the <tw-storydata> element from the given HAST tree and updates the story data store with its properties.
   *
   * @param {Root} tree - The HAST tree to search for the story data element.
   * @returns {Element | undefined} The found <tw-storydata> element, or undefined if not found.
   */
  function extractStoryData(tree: Root): Element | undefined {
    let found: Element | undefined
    visit(tree, 'element', node => {
      if (node.type === 'element' && 'tagName' in node) {
        if (node.tagName === 'tw-storydata') {
          found = node as Element
          setStoryData(found.properties || {})
          return EXIT
        }
      }
    })
    return found
  }

  /**
   * Extracts all <tw-passagedata> elements from the given HAST tree and updates the story data store.
   *
   * @param {Root} tree - The HAST tree to search for passage elements.
   * @returns {Element[]} An array of passage elements found in the tree.
   */
  const extractPassages = (tree: Root): Element[] => {
    const passages: Element[] = []
    visit(tree, 'element', node => {
      if (node.tagName === 'tw-passagedata') {
        passages.push(node as Element)
      }
    })
    setPassages(passages)
    return passages
  }

  const initialize = (
    doc: Document | undefined = typeof document === 'undefined'
      ? undefined
      : document
  ) => {
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
      setCurrentPassage(start)
    }
    return story
  }

  useEffect(() => {
    const story = initialize()
    const debug = story?.properties?.options === 'debug'
    if (!i18next.isInitialized) {
      void i18next.use(initReactI18next).init({
        lng: i18next.language || 'en-US',
        fallbackLng: 'en-US',
        resources: {},
        debug
      })
    } else {
      i18next.options.debug = debug
    }
  }, [])

  return (
    <div className={'absolute inset-0 overflow-y-auto overflow-x-hidden'}>
      {passage ? <Passage /> : null}
      <DebugWindow />
    </div>
  )
}
