import { describe, it, expect } from 'bun:test'
import { render, fireEvent } from '@testing-library/preact'
import { Radio } from '@campfire/components/Passage/Radio'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Tests for the Radio component.
 */
describe('Radio', () => {
  it('sets game state on click', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Radio stateKey='choice' value='a' />)
    const button = getByTestId('radio') as HTMLButtonElement
    fireEvent.click(button)
    expect(useGameStore.getState().gameData.choice).toBe('a')
    fireEvent.click(button)
    expect(useGameStore.getState().gameData.choice).toBe('a')
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Radio
        stateKey='choice'
        value='a'
        className='extra'
        style={{ color: 'red' }}
      />
    )
    const button = getByTestId('radio') as HTMLButtonElement
    expect(button.className.split(' ')).toContain('campfire-radio')
    expect(button.className.split(' ')).toContain('extra')
    expect(button.style.color).toBe('red')
  })

  it('uses existing state value when present', () => {
    useGameStore.setState({ gameData: { choice: 'b' } })
    const { getByTestId } = render(<Radio stateKey='choice' value='a' />)
    const button = getByTestId('radio') as HTMLButtonElement
    expect(button.getAttribute('aria-checked')).toBe('false')
  })

  it('initializes state when unset', () => {
    useGameStore.setState({ gameData: {} })
    render(<Radio stateKey='choice' value='a' />)
    expect(useGameStore.getState().gameData.choice).toBeUndefined()
  })

  it('renders transparent indicator when unchecked', () => {
    useGameStore.setState({ gameData: {} })
    const { getByTestId } = render(<Radio stateKey='choice' value='a' />)
    const button = getByTestId('radio') as HTMLButtonElement
    const svg = button.querySelector('svg') as SVGSVGElement
    expect(svg).not.toBeNull()
    expect(svg.getAttribute('fill')).toBe('transparent')
    expect(svg.getAttribute('stroke')).toBe('transparent')
    fireEvent.click(button)
    const svgChecked = button.querySelector('svg') as SVGSVGElement
    expect(svgChecked.getAttribute('fill')).toBe('currentColor')
    expect(svgChecked.getAttribute('stroke')).toBe('currentColor')
  })
})
