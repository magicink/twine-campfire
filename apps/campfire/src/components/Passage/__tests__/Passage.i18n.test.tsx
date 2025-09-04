import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'
import { getLanguages } from '@campfire/hooks/handlers/i18nHandlers'

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
      children: [{ type: 'text', value: '::lang[fr-FR]' }]
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

  it('ignores inline lang directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'before :lang[fr] after' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(i18next.language).toBe('en-US')
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

  it('applies className and style attributes to t directive', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':t[hello]{className="greet" style="color:blue"}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const span = await screen.findByText('Hello')
    expect(span.className).toContain('greet')
    expect(span).toHaveStyle('color: blue')
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
          value: '::translations[en-US]{translation:apple_one="1 apple"}\n'
        },
        {
          type: 'text',
          value:
            '::translations[en-US]{translation:apple_other="{{count}} apples"}\n'
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
          value: '::translations[en-US]{translation:apple_one="1 apple"}\n'
        },
        {
          type: 'text',
          value:
            '::translations[en-US]{translation:apple_other="{{count}} apples"}\n'
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
          value: '::translations[en-US]{translation:greet="Hello, {{name}}!"}\n'
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
          value: '::translations[en-US]{translation:next="Next"}\n'
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
          value: '::translations[en-US]{ui:goodbye="Au revoir"}\n'
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

  it('supports namespace attribute on t directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: '::translations[en-US]{ui:bye="Bye"}\n' },
        { type: 'text', value: ':t[bye]{ns="ui"}' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Bye')
    expect(text).toBeInTheDocument()
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

  it('re-renders translation when lang state changes', async () => {
    i18next.addResource('en-US', 'ui', 'greet', 'Hello')
    i18next.addResource('fr', 'ui', 'greet', 'Bonjour')
    useGameStore.setState({ gameData: { lang: 'en-US' } })
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::effect[lang]\n::lang[lang]\n:::\n:t[ui:greet]'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    expect(await screen.findByText('Hello')).toBeInTheDocument()

    act(() => {
      useGameStore.getState().setGameData({ lang: 'fr' })
    })

    await waitFor(() => {
      expect(screen.getByText('Bonjour')).toBeInTheDocument()
    })
  })

  it('adds translation via shorthand syntax', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::translations[en-US]{ui:greet="Hello there"}\n'
        },
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

  it('sets language label with setLanguageLabel directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::setLanguageLabel[fr="Français"]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(i18next.t('label', { lng: 'fr', ns: 'language' })).toBe('Français')
    })
  })

  it('lists languages with getLanguages', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: '::setLanguageLabel[fr="Français"]\n' },
        { type: 'text', value: '::setLanguageLabel[en-US="English (US)"]' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(
        getLanguages().sort((a, b) => a.code.localeCompare(b.code))
      ).toEqual([
        { code: 'en-US', label: 'English (US)' },
        { code: 'fr', label: 'Français' }
      ])
    })
  })

  it('sets languages array via set directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: '::setLanguageLabel[fr="Français"]\n' },
        {
          type: 'text',
          value: '::setLanguageLabel[en-US="English (US)"]\n'
        },
        { type: 'text', value: '::set[languages=getLanguages()]' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const languages = [
        ...(useGameStore.getState().gameData.languages as {
          code: string
          label: string
        }[])
      ].sort((a, b) => a.code.localeCompare(b.code))
      expect(languages).toEqual([
        { code: 'en-US', label: 'English (US)' },
        { code: 'fr', label: 'Français' }
      ])
    })
  })

  it('returns empty array when i18n is not initialized', () => {
    const original = i18next.isInitialized
    ;(i18next as unknown as { isInitialized: boolean }).isInitialized = false
    expect(getLanguages()).toEqual([])
    ;(i18next as unknown as { isInitialized: boolean }).isInitialized = original
  })

  it('reports error when multiple pairs are provided', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::translations[en-US]{ui:greet="Hello" ui:bye="Bye"}\n'
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
