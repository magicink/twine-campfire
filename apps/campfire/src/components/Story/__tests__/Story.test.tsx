import { render, screen, act, waitFor } from '@testing-library/preact'
import { Story } from '@campfire/components/Story/Story'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { samplePassage } from '@campfire/test-utils/helpers'
import { describe, it, expect, beforeEach } from 'bun:test'
import i18next from 'i18next'

describe('Story', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    useStoryDataStore.setState({
      storyData: {},
      passages: [],
      currentPassageId: undefined
    })
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
    render(<Story />)

    expect(document.body.textContent).toBe('')
  })

  it('renders the current passage when available', async () => {
    useStoryDataStore.setState({
      passages: [samplePassage],
      currentPassageId: '1'
    })

    render(<Story />)

    const text = await screen.findByText(/Hello/)
    expect(text).toBeInTheDocument()
  })

  it('initializes the story on mount', () => {
    const el = document.createElement('tw-storydata')
    el.setAttribute('name', 'Story Test')
    document.body.appendChild(el)

    render(<Story />)

    expect(useStoryDataStore.getState().storyData).toEqual({
      name: 'Story Test'
    })
  })

  it('enables i18next debug when story options debug', () => {
    const el = document.createElement('tw-storydata')
    el.setAttribute('options', 'debug')
    document.body.appendChild(el)

    render(<Story />)

    expect(i18next.options.debug).toBe(true)
  })

  it('renders content based on if directives', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">:::set[open=true]
:::

:::trigger{label="open"}
:::set[open=false]
:::

:::if{!open}
not open
:::

:::if{open}
is open!
:::</tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
    await screen.findByText('is open!')
    expect(screen.queryByText('not open')).toBeNull()
    const button = await screen.findByRole('button', { name: 'open' })
    act(() => {
      button.click()
    })
    await screen.findByText('not open')
    expect(screen.queryByText('is open!')).toBeNull()
  })

  it('renders trigger directives within if directives', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">:::set[open=true]
:::

:::if{open}
:::trigger{label="open"}
:::set[clicked=true]
:::
:::
:::
</tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
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
  <tw-passagedata pid="1" name="Start">:::set[open=true]
:::

:::if{!open}
not open
:::</tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
    await waitFor(() => expect(screen.queryByText('not open')).toBeNull())
    expect(screen.queryByText(':::if{!open}')).toBeNull()
  })

  it('does not render ::: when if has no else', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">:::set[open=true]
:::

:::if{open}
:::set[done=true]
:::
:::
  </tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
    await waitFor(() =>
      expect(useGameStore.getState().gameData.done).toBe(true)
    )
    expect(screen.queryByText(':::')).toBeNull()
  })

  it('executes only the matching branch when else is present', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">:::set[open=true]
:::

:::if{open}
:::set[yes=true]
:::
:::else
:::set[no=true]
:::
:::
  </tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
    await waitFor(() => expect(useGameStore.getState().gameData.yes).toBe(true))
    expect(useGameStore.getState().gameData.no).toBeUndefined()
    expect(screen.queryByText(':::')).toBeNull()
  })

  it('renders else block when condition is false', async () => {
    document.body.innerHTML = `
<tw-storydata name="Story" startnode="1">
  <tw-passagedata pid="1" name="Start">:::set[open=false]
:::

:::if{open}
:::set[yes=true]
:::
:::else
:::set[no=true]
:::
:::
  </tw-passagedata>
</tw-storydata>
    `
    render(<Story />)
    await waitFor(() => expect(useGameStore.getState().gameData.no).toBe(true))
    expect(useGameStore.getState().gameData.yes).toBeUndefined()
    expect(screen.queryByText(':::')).toBeNull()
  })
})
