import { render, screen, act, waitFor } from '@testing-library/preact'
import { Campfire } from '@campfire/components/Campfire'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { useOverlayStore } from '@campfire/state/useOverlayStore'
import { samplePassage } from '@campfire/test-utils/helpers'
import { describe, it, expect, beforeEach } from 'bun:test'
import i18next from 'i18next'

describe('Story', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    useStoryDataStore.setState({
      storyData: {},
      passages: [],
      overlayPassages: [],
      currentPassageId: undefined
    })
    useOverlayStore.setState({ overlays: [] })
    useGameStore.setState({
      gameData: {},
      _initialGameData: {},
      lockedKeys: {},
      onceKeys: {},
      checkpoints: {},
      errors: [],
      loading: false
    })
    localStorage.clear()
    if (!i18next.isInitialized) {
      await i18next.init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
    i18next.options.debug = false
  })

  it('renders nothing when no passage is set', () => {
    render(<Campfire />)

    expect(document.body.textContent).toBe('')
  })

  it('renders the current passage when available', async () => {
    useStoryDataStore.setState({
      passages: [samplePassage],
      currentPassageId: '1'
    })

    render(<Campfire />)

    const text = await screen.findByText(/Hello/)
    expect(text).toBeInTheDocument()
    const container = screen.getByTestId('campfire')
    expect(container.className).toContain('campfire-base')
  })

  it('initializes the story on mount', () => {
    const el = document.createElement('tw-storydata')
    el.setAttribute('name', 'Story Test')
    document.body.appendChild(el)

    render(<Campfire />)

    expect(useStoryDataStore.getState().storyData).toEqual({
      name: 'Story Test'
    })
  })

  it('enables i18next debug when story options debug', () => {
    const el = document.createElement('tw-storydata')
    el.setAttribute('options', 'debug')
    document.body.appendChild(el)

    render(<Campfire />)

    expect(i18next.options.debug).toBe(true)
  })

  it('resets game state on unmount', () => {
    useGameStore.getState().init({ hp: 10 })
    useGameStore.getState().setGameData({ hp: 5 })
    const { unmount } = render(<Campfire />)
    unmount()
    expect(useGameStore.getState().gameData).toEqual({ hp: 10 })
  })

  it('renders trigger directives within if directives', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">\n::set[open=true]

:::if[open]
:::trigger{label="open"}
::set[clicked=true]
:::
:::
</tw-passagedata>
</tw-storydata>
    `
    render(<Campfire />)
    const button = await screen.findByRole('button', { name: 'open' })
    expect(button).toBeInTheDocument()
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.clicked).toBe(true)
    })
  })

  it('parses if directives after blank lines', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">\n::set[open=true]

:::if[!open]
not open
:::
</tw-passagedata>
</tw-storydata>
    `
    render(<Campfire />)
    await waitFor(() => expect(screen.queryByText('not open')).toBeNull())
    expect(screen.queryByText(':::if[!open]')).toBeNull()
  })

  it('does not render ::: when if has no else', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">\n::set[open=true]

:::if[open]
::set[done=true]
:::
  </tw-passagedata>
</tw-storydata>
    `
    render(<Campfire />)
    await waitFor(() =>
      expect(useGameStore.getState().gameData.done).toBe(true)
    )
    expect(screen.queryByText(':::')).toBeNull()
  })

  it('skips the block when the condition is false', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">::set[open=false]

:::if[open]
::set[yes=true]
:::
  </tw-passagedata>
</tw-storydata>
    `
    render(<Campfire />)
    await waitFor(() => expect(screen.queryByText(':::')).toBeNull())
    expect(useGameStore.getState().gameData.yes).toBeUndefined()
  })
})
