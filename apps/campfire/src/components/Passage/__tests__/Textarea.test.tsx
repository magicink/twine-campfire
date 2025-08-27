import { describe } from 'bun:test'
import { Textarea } from '@campfire/components/Passage/Textarea'
import { runFormFieldTests } from '@campfire/test-utils/formFieldTests'

/**
 * Tests for the Textarea component.
 */
describe('Textarea', () => {
  runFormFieldTests({
    Component: Textarea,
    testId: 'textarea',
    campfireClass: 'campfire-textarea',
    updateValue: 'Hello',
    existingValue: 'Existing'
  })
})
