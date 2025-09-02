import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage rendering and navigation', () => {
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

  it('renders the current passage', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello **world**' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText(/Hello/)
    expect(text).toBeInTheDocument()
  })

  it('applies full height class to passage wrapper', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const wrapper = screen.getByTestId('passage')
    expect(wrapper).toHaveClass('h-full')
  })

  it('preserves line breaks in passage text', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Line one\nLine two' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText(/Line one/)
    expect(text.textContent).toBe('Line one\nLine two')
  })

  it('renders nothing when no passage is set', () => {
    render(<Passage />)
    expect(document.body.textContent).toBe('')
  })

  it('sets document title to passage name', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello' }]
    }

    useStoryDataStore.setState({
      storyData: { name: 'Story' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)

    await waitFor(() => {
      expect(document.title).toBe('Story: Start')
    })
  })

  it('overrides title with title directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':title["Custom"]' }]
    }

    useStoryDataStore.setState({
      storyData: { name: 'Story' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)

    await waitFor(() => {
      expect(document.title).toBe('Custom')
    })
  })

  it('logs error when title directive is not quoted', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':title[Custom]' }]
    }

    useStoryDataStore.setState({
      storyData: { name: 'Story' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)

    await waitFor(() => {
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Title directive value must be wrapped in matching quotes or backticks'
      ])
      expect(document.title).toBe('Story: Start')
    })

    console.error = orig
  })

  it('ignores title directive in included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include["Second"]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: ':title["Other"]' }]
    }

    useStoryDataStore.setState({
      storyData: { name: 'Story' },
      passages: [start, second],
      currentPassageId: '1'
    })
    render(<Passage />)

    await waitFor(() => {
      expect(document.title).toBe('Story: Start')
    })
  })

  it('uses custom title separator when provided', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello' }]
    }
    useStoryDataStore.setState({
      storyData: { name: 'Story', 'title-separator': ' - ' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    await waitFor(() => {
      expect(document.title).toBe('Story - Start')
    })
  })

  it('can hide passage name in title', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello' }]
    }
    useStoryDataStore.setState({
      storyData: { name: 'Story', 'title-show-passage': 'false' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    await waitFor(() => {
      expect(document.title).toBe('Story')
    })
  })

  it('navigates to the linked passage when a button is clicked', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Go to [[Next]]' }]
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

  it('navigates to a passage by name with goto directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':goto["Second"]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Second text')).toBeInTheDocument()
      expect(useStoryDataStore.getState().currentPassageId).toBe('Second')
    })
  })

  it('navigates to a passage by pid with goto directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':goto[2]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Second text')).toBeInTheDocument()
      expect(useStoryDataStore.getState().currentPassageId).toBe('2')
    })
  })

  it('navigates to a passage using a state key with goto directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':goto{passage=next}' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useGameStore.setState({ gameData: { next: 'Second' } })
    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Second text')).toBeInTheDocument()
      expect(useStoryDataStore.getState().currentPassageId).toBe('Second')
    })
  })

  it('renders included passage content', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include["Second"]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Inner text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Inner text')
    expect(text).toBeInTheDocument()
  })

  it('includes a passage using a state key with include directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include{passage=part}' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Inner text' }]
    }

    useGameStore.setState({ gameData: { part: 'Second' } })
    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Inner text')
    expect(text).toBeInTheDocument()
  })

  it('evaluates directives within included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include["Second"]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: '::set[visited=true]\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).visited
      ).toBe(true)
    )
  })

  it('processes directives after including empty passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':include["Second"]\n:::if[true]\nAfter\n:::'
        }
      ]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('After')
    expect(text).toBeInTheDocument()
  })
})
