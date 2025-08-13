import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { resetStores } from '@campfire/test-utils/helpers'

// ensure AGENTS instructions: we will run format etc; root instructions apply.

describe('If with sequence', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('does not render sequence when condition is false', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':set[showNext=false]\n\n:::if{showNext}\n  :::sequence\n    :::step\n      :::transition\n      Moving on...\n      :::\n    :::\n    :::step\n      :::transition{delay=450}\n      Next slide\n      :::\n    :::\n  :::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    expect(screen.queryByText('Next slide')).toBeNull()
    expect(screen.queryByText('Moving on...')).toBeNull()
  })
})
