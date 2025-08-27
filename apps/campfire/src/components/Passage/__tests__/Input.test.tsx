import { describe } from 'bun:test'
import { Input } from '@campfire/components/Passage/Input'
import { runFormFieldTests } from '@campfire/test-utils/formFieldTests'

/**
 * Tests for the Input component.
 */
describe('Input', () => {
  runFormFieldTests({
    Component: Input,
    testId: 'input',
    campfireClass: 'campfire-input',
    updateValue: 'Sam',
    existingValue: 'Existing'
  })
})
