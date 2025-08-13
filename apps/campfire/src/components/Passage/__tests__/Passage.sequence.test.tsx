import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage sequence directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({
        lng: 'en-US',
        resources: {}
      })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders sequence steps and runs onComplete content', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence{autoplay}\nFirst\n\nSecond\n\n:::onComplete\n:set[done=true]\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('First')).toBeInTheDocument()
    const continueBtn = await screen.findByRole('button', {
      name: 'Continue to next step'
    })
    act(() => {
      continueBtn.click()
    })
    expect(await screen.findByText('Second')).toBeInTheDocument()
    await waitFor(() => {
      expect(useGameStore.getState().gameData.done).toBe(true)
    })
  })

  it('handles nested directives within indented steps', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n    :::transition\n    Hello\n    :::\n\n    :::transition\n    How are you?\n    :::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(await screen.findByText('How are you?')).toBeInTheDocument()
    expect(screen.queryByText(':::transition')).toBeNull()
  })

  it('renders multiple transitions across sequence steps', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n:::transition\nOne\n:::\n\n:::transition\nTwo\n:::\n\n:::transition\nThree\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('One')).toBeInTheDocument()
    expect(await screen.findByText('Two')).toBeInTheDocument()
    expect(await screen.findByText('Three')).toBeInTheDocument()
    expect(screen.queryByText(':::transition')).toBeNull()
  })

  it('does not render stray colons when directives close consecutively', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::sequence\n:::transition\nFoo\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('Foo')).toBeInTheDocument()
    expect(screen.queryByText(':::')).toBeNull()
  })

  it('handles trigger directives inside transitions', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n:::transition\n:::trigger{label="Fire"}\n:::set[fired=true]\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.fired).toBe(true)
    })
  })

  it('applies transition styles to trigger directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n:::transition{delay=500}\n:::trigger{label="Fire"}\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    expect(button.style.transition).toContain('opacity 300ms ease-in')
    expect(button.style.transitionDelay).toBe('500ms')
  })

  it('renders sequences within if directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence{autoplay}\nOuter\n\n:::if{true}\n:::sequence\nInner\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    expect(() => render(<Passage />)).not.toThrow()
    const continueBtn = await screen.findByRole('button', {
      name: 'Continue to next step'
    })
    act(() => {
      continueBtn.click()
    })
    expect(await screen.findByText('Inner')).toBeInTheDocument()
  })

  it('does not render sequence steps when if condition is false', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\nOuter\n\n:::if{false}\n:::sequence\n:::transition\nFirst\n:::\n\n:::transition{delay=450}\nSecond\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    expect(screen.queryByText('First')).toBeNull()
    expect(screen.queryByText('Second')).toBeNull()
  })
})
