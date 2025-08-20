import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'

/**
 * Tests for the TriggerButton component.
 */
describe('TriggerButton', () => {
  it('stops click propagation', () => {
    let clicked = false
    const { getByTestId } = render(
      <div
        onClick={() => {
          clicked = true
        }}
      >
        <TriggerButton content='[]'>Fire</TriggerButton>
      </div>
    )
    fireEvent.click(getByTestId('trigger-button'))
    expect(clicked).toBe(false)
  })
})
