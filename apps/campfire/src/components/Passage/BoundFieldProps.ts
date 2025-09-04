/**
 * Common props for form fields bound to a game state key.
 *
 * @template V Type of the initial value for the bound field.
 */
export interface BoundFieldProps<V> {
  /** Key in game state to bind the field value to. */
  stateKey: string
  /** Additional CSS classes for the element. */
  className?: string | string[]
  /** Serialized directives to run on mouse enter. */
  onMouseEnter?: string
  /** Serialized directives to run on mouse leave. */
  onMouseLeave?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Initial value if the state key is unset. */
  initialValue?: V
  /** Boolean or state key controlling the disabled state. */
  disabled?: boolean | string
}
