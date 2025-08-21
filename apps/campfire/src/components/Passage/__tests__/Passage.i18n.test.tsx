import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage i18n directives', () => {
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

  it('changes locale with lang directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':lang[fr-FR]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(i18next.language).toBe('fr-FR')
    })
  })

  it('retrieves translations with t directive', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':t[hello]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()
  })

  it('evaluates expressions for translation keys', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':t[flag ? "hello" : "missing"]' }]
    }

    useGameStore.setState({ gameData: { flag: true } })
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()
  })

  it('handles pluralization with t directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{translation:apple_one="1 apple"}'
        },
        {
          type: 'text',
          value:
            ':translations[en-US]{translation:apple_other="{{count}} apples"}'
        },
        { type: 'text', value: ':t[apple]{count=2}' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('2 apples')
    expect(text).toBeInTheDocument()
  })

  it('uses game data for pluralization with t directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{translation:apple_one="1 apple"}'
        },
        {
          type: 'text',
          value:
            ':translations[en-US]{translation:apple_other="{{count}} apples"}'
        },
        { type: 'text', value: ':t[apple]{count=appleCount}' }
      ]
    }

    useGameStore.setState({ gameData: { appleCount: 3 } })
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('3 apples')
    expect(text).toBeInTheDocument()
  })

  it('supports interpolation with t directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{translation:greet="Hello, {{name}}!"}'
        },
        { type: 'text', value: ':t[greet]{name=player}' }
      ]
    }

    useGameStore.setState({ gameData: { player: 'Sam' } })
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello, Sam!')
    expect(text).toBeInTheDocument()
  })

  it('uses fallback when translation is missing', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':t[missing]{fallback=`Hello ${player}`}' }
      ]
    }

    useGameStore.setState({ gameData: { player: 'Sam' } })
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello Sam')
    expect(text).toBeInTheDocument()
  })

  it('resolves translations inside links', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{translation:next="Next"}'
        },
        { type: 'text', value: '[[:t[next]->Next]]' }
      ]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    const button = await screen.findByRole('button', { name: 'Next' })
    button.click()
    expect(useStoryDataStore.getState().currentPassageId).toBe('Next')
  })

  it('creates namespaces from translations directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{ui:goodbye="Au revoir"}'
        },
        { type: 'text', value: ':t[ui:goodbye]' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Au revoir')
    expect(text).toBeInTheDocument()
    expect(i18next.hasResourceBundle('en-US', 'ui')).toBe(true)
  })

  it('updates translations when language changes', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    i18next.addResource('fr-FR', 'translation', 'hello', 'Bonjour')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':t[hello]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    expect(await screen.findByText('Hello')).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('fr-FR')
    })

    expect(await screen.findByText('Bonjour')).toBeInTheDocument()
  })

  it('adds translation via shorthand syntax', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':translations[en-US]{ui:greet="Hello there"}' },
        { type: 'text', value: ':t[ui:greet]' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello there')
    expect(text).toBeInTheDocument()
  })

  it('reports error when multiple pairs are provided', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':translations[en-US]{ui:greet="Hello" ui:bye="Bye"}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().errors.length).toBe(1)
    })
  })
})
