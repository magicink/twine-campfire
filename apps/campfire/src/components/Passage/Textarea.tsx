import { mergeClasses } from '@campfire/utils/core'
import {
  createBoundTextField,
  fieldBaseStyles,
  type BoundFieldElementProps
} from './BoundFieldProps'

const textareaStyles = mergeClasses(
  fieldBaseStyles,
  'field-sizing-content min-h-16 px-3 py-2'
)

export type TextareaProps = BoundFieldElementProps<HTMLTextAreaElement, string>

/**
 * Textarea bound to a game state key. Updates the key on user input.
 */
export const Textarea = createBoundTextField<'textarea'>({
  tag: 'textarea',
  baseClassNames: ['campfire-textarea', textareaStyles],
  testId: 'textarea'
})

export default Textarea
