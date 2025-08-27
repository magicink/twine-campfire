import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/preact'
import { Select } from '@campfire/components/Passage/Select'
import { Option } from '@campfire/components/Passage/Option'
import { runFormFieldTests } from '@campfire/test-utils/formFieldTests'

/**
 * Tests for the Select component.
 */
describe('Select', () => {
  runFormFieldTests({
    Component: Select,
    testId: 'select',
    campfireClass: 'campfire-select',
    updateValue: 'blue',
    existingValue: 'blue',
    children: (
      <>
        <Option value='red'>Red</Option>
        <Option value='blue'>Blue</Option>
      </>
    ),
    initialState: { field: 'red' }
  })

  it('renders with default border, text color, and background', () => {
    const { getByTestId } = render(
      <Select stateKey='field'>
        <Option value='a'>A</Option>
      </Select>
    )
    const field = getByTestId('select') as HTMLSelectElement
    expect(field.style.border).toBe('1px solid black')
    expect(field.style.color).toBe('#000')
    expect(field.style.backgroundColor).toBe('#fff')
  })
})
