import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('If directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('renders multiple container directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::if{true}\n  :::trigger{label="One"}\n  :::\n  :::trigger{label="Two"}\n  :::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    expect(
      await screen.findByRole('button', { name: 'One' })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Two' })
    ).toBeInTheDocument()
  })

  it('does not wrap container directives in paragraphs', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::if{true}\n  :::trigger{label="One"}\n  :::\n  :::trigger{label="Two"}\n  :::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    const one = await screen.findByRole('button', { name: 'One' })
    const two = await screen.findByRole('button', { name: 'Two' })
    expect(one.parentElement?.tagName.toLowerCase()).not.toBe('p')
    expect(two.parentElement?.tagName.toLowerCase()).not.toBe('p')
  })

  it('skips all directives when condition is false', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::if{false}\n  :::trigger{label="One"}\n  :::\n  :::trigger{label="Two"}\n  :::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    expect(screen.queryByRole('button', { name: 'One' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Two' })).toBeNull()
  })
})
