import { useEffect, useState } from 'preact/hooks'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { Passage } from '@campfire/components/Passage/Passage'
import { LoadingScreen } from '@campfire/components/LoadingScreen'
import { Overlay } from '@campfire/components/Overlay'
import { fromDom } from 'hast-util-from-dom'
import type { Element, Root } from 'hast'
import { EXIT, visit } from 'unist-util-visit'
import { applyUserStyles } from '@campfire/components/Campfire/applyUserStyles'
import { evaluateUserScript } from '@campfire/components/Campfire/evaluateUserScript'
import { useOverlayProcessor } from '@campfire/hooks/useOverlayProcessor'
import { useOrientationController } from '@campfire/hooks/useOrientationController'

/**
 * React component that renders the main story interface.
 *
 * This component initializes story data, passages, user styles, and user scripts from a Twine-compatible document structure.
 * It manages the current passage and story presentation.
 *
 * @param assets - Optional list of assets to preload before showing the first passage.
 * @component
 */
export const Campfire = ({
  assets = []
}: {
  assets?: { type: 'image' | 'audio'; id: string; src: string }[]
}) => {
  const [i18nInitialized, setI18nInitialized] = useState(i18next.isInitialized)
  const [startNodeId, setStartNodeId] = useState<string>()
  const getCurrentPassage = useStoryDataStore.use.getCurrentPassage()
  const passage = getCurrentPassage()
  const setPassages = useStoryDataStore.use.setPassages()
  const setOverlayPassages = useStoryDataStore.use.setOverlayPassages()
  const setStoryData = useStoryDataStore.use.setStoryData()

  useOverlayProcessor()
  useOrientationController()

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
   * Passages tagged with "overlay" are stored separately from regular passages.
   *
   * @param {Root} tree - The HAST tree to search for passage elements.
   * @returns {Element[]} An array of non-overlay passage elements found in the tree.
   */
  const extractPassages = (tree: Root): Element[] => {
    const passages: Element[] = []
    const overlays: Element[] = []
    visit(tree, 'element', node => {
      if (node.tagName === 'tw-passagedata') {
        const tags =
          typeof node.properties?.tags === 'string'
            ? node.properties.tags.toLowerCase().split(/\s+/)
            : []
        if (tags.includes('overlay')) {
          overlays.push(node as Element)
        } else {
          passages.push(node as Element)
        }
      }
    })
    setPassages(passages)
    setOverlayPassages(overlays)
    return passages
  }

  const initialize = (doc: Document | undefined = globalThis.document) => {
    if (!doc?.querySelector) return
    const el = doc.querySelector('tw-storydata')
    if (!el) return
    const tree = fromDom(el)
    const story = extractStoryData(tree as Root)
    extractPassages(tree as Root)
    applyUserStyles(doc)
    evaluateUserScript(doc)
    const start = story?.properties?.startnode as string | undefined
    if (start) {
      setStartNodeId(start)
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

  useEffect(() => useGameStore.getState().reset, [])

  if (!i18nInitialized) return null
  if (!passage) {
    if (!startNodeId) return null
    return <LoadingScreen assets={assets} targetPassage={startNodeId} />
  }

  return (
    <div
      className={
        'campfire-base absolute inset-0 overflow-y-auto overflow-x-hidden'
      }
      data-testid='campfire'
    >
      <Overlay />
      <Passage />
    </div>
  )
}
