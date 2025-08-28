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

  it('displays label when no value is selected', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(
      <Select stateKey='field' label='Pick one'>
        <Option value='a'>A</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLButtonElement
    expect(field.textContent).toBe('Pick one')
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

  it('positions options absolutely', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId, getByRole } = render(
      <Select stateKey='field'>
        <Option value='a'>A</Option>
      </Select>
    )
    fireEvent.click(getByTestId('select'))
    const listbox = getByRole('listbox') as HTMLDivElement
    expect(listbox.className.split(' ')).toContain('absolute')
  })

  it('renders caret icon', () => {
    const { getByTestId } = render(
      <Select stateKey='field'>
        <Option value='a'>A</Option>
      </Select>
    )
    const caret = getByTestId('select').querySelector('svg') as SVGElement
    expect(caret.getAttribute('class')?.split(' ')).toEqual(
      expect.arrayContaining(['h-4', 'w-4'])
    )
  })

  it('closes when clicking outside', async () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId, queryByRole } = render(
      <div>
        <Select stateKey='field'>
          <Option value='a'>A</Option>
        </Select>
        <div data-testid='outside'>outside</div>
      </div>
    )
    fireEvent.click(getByTestId('select'))
    expect(queryByRole('listbox')).not.toBeNull()
    fireEvent.mouseDown(getByTestId('outside'))
    await new Promise(r => setTimeout(r, 0))
    expect(queryByRole('listbox')).toBeNull()
  })

  it('closes when pressing Escape', async () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId, queryByRole } = render(
      <Select stateKey='field'>
        <Option value='a'>A</Option>
      </Select>
    )
    fireEvent.click(getByTestId('select'))
    expect(queryByRole('listbox')).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    await new Promise(r => setTimeout(r, 0))
    expect(queryByRole('listbox')).toBeNull()
  })
})
