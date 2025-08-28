import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Select } from '@campfire/components/Passage/Select'
import { Option } from '@campfire/components/Passage/Option'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Select component.
 */
describe('Select', () => {
  it('updates game state on selection', async () => {
    useGameStore.setState({ gameData: { field: 'red' } })
    const { getByTestId, getAllByTestId } = render(
      <Select stateKey='field'>
        <Option value='red'>Red</Option>
        <Option value='blue'>Blue</Option>
      </Select>
    )
    fireEvent.click(getByTestId('select'))
    await new Promise(r => setTimeout(r, 0))
    fireEvent.click(getAllByTestId('option')[1])
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).field
    ).toBe('blue')
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Select stateKey='field' className='extra' style={{ color: 'red' }}>
        <Option value='a'>A</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLButtonElement
    expect(field.className.split(' ')).toContain('campfire-select')
    expect(field.className.split(' ')).toContain('extra')
    expect(field.style.color).toBe('red')
  })

  it('uses existing state value when present', () => {
    useGameStore.setState({ gameData: { field: 'blue' } })
    const { getByTestId } = render(
      <Select stateKey='field'>
        <Option value='blue'>Blue</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLButtonElement
    expect(field.value).toBe('blue')
  })

  it('initializes state when unset', () => {
    useGameStore.setState({ gameData: {} })
    render(
      <Select stateKey='field'>
        <Option value='a'>A</Option>
      </Select>
    )
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).field
    ).toBe('')
  })
})
