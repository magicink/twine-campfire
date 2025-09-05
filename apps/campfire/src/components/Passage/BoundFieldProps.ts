import type { JSX } from 'preact'

/** Base Tailwind CSS classes shared by form field components. */
export const fieldBaseStyles =
  'placeholder:text-muted-foreground border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-full rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

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

type ElementAttributes<T extends HTMLElement> = T extends HTMLInputElement
  ? JSX.InputHTMLAttributes<T>
  : T extends HTMLTextAreaElement
    ? JSX.TextareaHTMLAttributes<T>
    : T extends HTMLSelectElement
      ? JSX.SelectHTMLAttributes<T>
      : T extends HTMLButtonElement
        ? JSX.ButtonHTMLAttributes<T>
        : JSX.HTMLAttributes<T>

/**
 * Props for a bound field rendering a specific HTMLElement.
 *
 * @template T Element type rendered.
 * @template V Type of the initial value for the bound field.
 */
export type BoundFieldElementProps<T extends HTMLElement, V> = Omit<
  ElementAttributes<T>,
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onFocus'
  | 'onBlur'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'disabled'
> &
  BoundFieldProps<V>
