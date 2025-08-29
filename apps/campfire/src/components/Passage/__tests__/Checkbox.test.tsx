import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Checkbox } from '@campfire/components/Passage/Checkbox'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Checkbox component.
 */
describe('Checkbox', () => {
  it('toggles game state on click', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Checkbox stateKey='flag' />)
    const button = getByTestId('checkbox') as HTMLButtonElement
    fireEvent.click(button)
    expect(useGameStore.getState().gameData.flag).toBe(true)
    fireEvent.click(button)
    expect(useGameStore.getState().gameData.flag).toBe(false)
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Checkbox stateKey='flag' className='extra' style={{ color: 'red' }} />
    )
    const button = getByTestId('checkbox') as HTMLButtonElement
    expect(button.className.split(' ')).toContain('campfire-checkbox')
    expect(button.className.split(' ')).toContain('extra')
    expect(button.style.color).toBe('red')
  })

  it('uses existing state value when present', () => {
    useGameStore.setState({ gameData: { flag: true } })
    const { getByTestId } = render(<Checkbox stateKey='flag' />)
    const button = getByTestId('checkbox') as HTMLButtonElement
    expect(button.getAttribute('aria-checked')).toBe('true')
  })

  it('initializes state when unset', () => {
    useGameStore.setState({ gameData: {} })
    render(<Checkbox stateKey='flag' />)
    expect(useGameStore.getState().gameData.flag).toBe(false)
  })

  it('renders checkmark only when checked', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Checkbox stateKey='flag' />)
    const button = getByTestId('checkbox') as HTMLButtonElement
    expect(button.querySelector('svg')).toBeNull()
    fireEvent.click(button)
    expect(button.querySelector('svg')).not.toBeNull()
  })
})
