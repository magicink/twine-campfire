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

  it('applies inline styles when provided', () => {
    const { getByTestId } = render(
      <TriggerButton content='[]' style={{ color: 'red' }}>
        Fire
      </TriggerButton>
    )
    expect(
      (getByTestId('trigger-button') as HTMLButtonElement).style.color
    ).toBe('red')
  })
})
