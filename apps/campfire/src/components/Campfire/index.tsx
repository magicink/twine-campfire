import { useEffect, useState } from 'preact/hooks'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  type StoryDataState,
  useStoryDataStore
} from '@campfire/state/useStoryDataStore'
import { Passage } from '@campfire/components/Passage/Passage'
import { DebugWindow } from '@campfire/components/DebugWindow'
import { fromDom } from 'hast-util-from-dom'
import type { Element, Root } from 'hast'
import { EXIT, visit } from 'unist-util-visit'
import { applyUserStyles } from '@campfire/components/Campfire/applyUserStyles'
import { evaluateUserScript } from '@campfire/components/Campfire/evaluateUserScript'

/**
 * React component that renders the main story interface.
 *
 * This component initializes story data, passages, user styles, and user scripts from a Twine-compatible document structure.
 * It manages the current passage and provides a debug window for development.
 *
 * @component
 */
export const Campfire = () => {
  const [i18nInitialized, setI18nInitialized] = useState(i18next.isInitialized)
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
  const extractStoryData = (tree: Root): Element | undefined => {
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
      i18next
        .use(initReactI18next)
        .init({
          lng: i18next.language || 'en-US',
          fallbackLng: 'en-US',
          resources: {},
          debug
        })
        .then(() => {
          setI18nInitialized(true)
        })
    } else {
      i18next.options.debug = debug
      setI18nInitialized(true)
    }
  }, [])

  if (!i18nInitialized) return null

  return (
    <div className={'absolute inset-0 overflow-y-auto overflow-x-hidden'}>
      {passage ? <Passage /> : null}
      <DebugWindow />
    </div>
  )
}
