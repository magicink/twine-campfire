import { render, fireEvent } from '@testing-library/preact'
import type { ComponentChildren, ComponentType } from 'preact'
import { useGameStore } from '@campfire/state/useGameStore'
import { expect, it } from 'bun:test'

interface FormFieldTestConfig {
  Component: ComponentType<any>
  testId: string
  campfireClass: string
  updateValue: string
  existingValue: string
  children?: ComponentChildren
  initialState?: Record<string, unknown>
}

/**
 * Runs shared assertions for stateful form fields.
 *
 * @param config - Options for the form field tests.
 */
export const runFormFieldTests = ({
  Component,
  testId,
  campfireClass,
  updateValue,
  existingValue,
  children,
  initialState = {}
}: FormFieldTestConfig) => {
  it('updates game state on input', () => {
    useGameStore.setState({ gameData: initialState })
    const { getByTestId } = render(
      <Component stateKey='field'>{children}</Component>
    )
    const field = getByTestId(testId) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    fireEvent.input(field, { target: { value: updateValue } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).field
    ).toBe(updateValue)
  })

  it('applies className and style', () => {
    const { getByTestId } = render(
      <Component stateKey='field' className='extra' style={{ color: 'red' }}>
        {children}
      </Component>
    )
    const field = getByTestId(testId) as HTMLElement
    expect(field.className.split(' ')).toContain(campfireClass)
    expect(field.className.split(' ')).toContain('extra')
    expect(field.style.color).toBe('red')
  })

  it('uses existing state value when present', () => {
    useGameStore.setState({ gameData: { field: existingValue } })
    const { getByTestId } = render(
      <Component stateKey='field'>{children}</Component>
    )
    const field = getByTestId(testId) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    expect(field.value).toBe(existingValue)
  })

  it('initializes state when unset', () => {
    useGameStore.setState({ gameData: {} })
    render(<Component stateKey='field'>{children}</Component>)
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).field
    ).toBe('')
  })
}
