import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Textarea } from '@campfire/components/Passage/Textarea'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Textarea component.
 */
describe('Textarea', () => {
  it('updates game state on input', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Textarea stateKey='bio' />)
    const field = getByTestId('textarea') as HTMLTextAreaElement
    fireEvent.input(field, { target: { value: 'Hello' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).bio
    ).toBe('Hello')
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Textarea stateKey='field' className='extra' style={{ color: 'red' }} />
    )
    const field = getByTestId('textarea') as HTMLTextAreaElement
    expect(field.className.split(' ')).toContain('campfire-textarea')
    expect(field.className.split(' ')).toContain('extra')
    expect(field.style.color).toBe('red')
  })

  it('uses existing state value when present', () => {
    useGameStore.setState({ gameData: { bio: 'Existing' } })
    const { getByTestId } = render(<Textarea stateKey='bio' />)
    const field = getByTestId('textarea') as HTMLTextAreaElement
    expect(field.value).toBe('Existing')
  })

  it('initializes state when unset', () => {
    useGameStore.setState({ gameData: {} })
    render(<Textarea stateKey='note' />)
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).note
    ).toBe('')
  })
})
