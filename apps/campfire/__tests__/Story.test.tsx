import { render, screen } from '@testing-library/react'
import { Story } from '../src/Story'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { samplePassage } from './helpers'
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
    if (!i18next.isInitialized) {
      await i18next.init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
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
})
