import { mergeClasses } from '@campfire/utils/core'
import {
  createBoundTextField,
  fieldBaseStyles,
  type BoundFieldElementProps
} from './BoundFieldProps'

const inputStyles = mergeClasses(
  fieldBaseStyles,
  'file:text-foreground selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none min-w-0 h-9 px-3 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium'
)

export type InputProps = BoundFieldElementProps<HTMLInputElement, string>

/**
 * Text input bound to a game state key. Updates the key on user input.
 */
export const Input = createBoundTextField<'input'>({
  tag: 'input',
  baseClassNames: ['campfire-input', inputStyles],
  testId: 'input'
})

export default Input
