import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Input } from '@campfire/components/Passage/Input'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Input component.
 */
describe('Input', () => {
  it('updates game state on input', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Input stateKey='name' />)
    const field = getByTestId('input') as HTMLInputElement
    fireEvent.input(field, { target: { value: 'Sam' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).name
    ).toBe('Sam')
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Input stateKey='field' className='extra' style={{ color: 'red' }} />
    )
    const field = getByTestId('input') as HTMLInputElement
    expect(field.className.split(' ')).toContain('campfire-input')
    expect(field.className.split(' ')).toContain('extra')
    expect(field.style.color).toBe('red')
  })
})
