import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Select } from '@campfire/components/Passage/Select'
import { Option } from '@campfire/components/Passage/Option'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Select component.
 */
describe('Select', () => {
  it('updates game state on change', () => {
    useGameStore.setState({ gameData: { color: 'red' } })
    const { getByTestId } = render(
      <Select stateKey='color'>
        <Option value='red'>Red</Option>
        <Option value='blue'>Blue</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLSelectElement
    fireEvent.input(field, { target: { value: 'blue' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).color
    ).toBe('blue')
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Select stateKey='field' className='extra' style={{ color: 'red' }}>
        <Option value='a'>A</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLSelectElement
    expect(field.className.split(' ')).toContain('campfire-select')
    expect(field.className.split(' ')).toContain('extra')
    expect(field.style.color).toBe('red')
  })
})
