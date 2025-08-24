import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { LinkButton } from '@campfire/components/Passage/LinkButton'

/**
 * Tests for the LinkButton component.
 */
describe('LinkButton', () => {
  it('stops click propagation', () => {
    let clicked = false
    const { getByTestId } = render(
      <div
        onClick={() => {
          clicked = true
        }}
      >
        <LinkButton>Go</LinkButton>
      </div>
    )
    fireEvent.click(getByTestId('link-button'))
    expect(clicked).toBe(false)
  })

  it('includes the campfire-link class by default', () => {
    const { getByTestId } = render(<LinkButton>Go</LinkButton>)
    expect(getByTestId('link-button').className).toContain('campfire-link')
  })
})
