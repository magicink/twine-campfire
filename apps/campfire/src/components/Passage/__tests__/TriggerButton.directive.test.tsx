import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for TriggerButton directive attributes.
 */
describe('TriggerButton directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('passes style attribute to the component', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label="Styled" style="color:blue"}\n:::'
        }
      ]
    }
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Styled' })
    expect((button as HTMLButtonElement).style.color).toBe('blue')
  })
})
