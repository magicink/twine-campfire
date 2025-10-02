import { h } from 'preact'
import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { useGameStore } from '@campfire/state/useGameStore'
import { mergeClasses, parseDisabledAttr } from '@campfire/utils/core'

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

/**
 * Parameters for the {@link useBoundField} hook.
 *
 * @template V Type of the bound value.
 */
interface UseBoundFieldParams<V> {
  /** Key in game state to bind the field value to. */
  stateKey: string
  /** Initial value if the state key is unset. */
  initialValue?: V
  /** Boolean or state key controlling the disabled state. */
  disabled?: boolean | string
  /** Serialized directives to run on mouse enter. */
  onMouseEnter?: string
  /** Serialized directives to run on mouse leave. */
  onMouseLeave?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
}

/**
 * Hook providing common binding logic for form fields.
 *
 * Retrieves the current value from the game state, applies an initial value if
 * unset, determines the disabled state, and wires directive event handlers.
 *
 * @template V Type of the bound value.
 * @param params - Hook parameters.
 * @returns Bound field state and helpers.
 */
export const useBoundField = <V>({
  stateKey,
  initialValue,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur
}: UseBoundFieldParams<V>) => {
  const gameData = useGameStore.use.gameData()
  const value = gameData[stateKey] as V | undefined
  const setGameData = useGameStore.use.setGameData()
  useEffect(() => {
    if (value === undefined && initialValue !== undefined) {
      setGameData({ [stateKey]: initialValue as any })
    }
  }, [value, stateKey, initialValue, setGameData])
  const setValue = (val: V) => {
    setGameData({ [stateKey]: val as any })
  }
  const isDisabled = parseDisabledAttr(disabled, gameData)
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  return { value, setValue, isDisabled, directiveEvents }
}

type BoundTextFieldElement<Tag extends 'input' | 'textarea'> =
  Tag extends 'input' ? HTMLInputElement : HTMLTextAreaElement

type BoundTextFieldAttributes<Tag extends 'input' | 'textarea'> =
  Tag extends 'input'
    ? JSX.InputHTMLAttributes<HTMLInputElement>
    : JSX.TextareaHTMLAttributes<HTMLTextAreaElement>

type BoundTextFieldProps<Tag extends 'input' | 'textarea'> =
  BoundFieldElementProps<BoundTextFieldElement<Tag>, string>

/**
 * Options for {@link createBoundTextField}.
 *
 * @template Tag Element tag rendered by the bound text field.
 */
interface CreateBoundTextFieldOptions<Tag extends 'input' | 'textarea'> {
  /** Element tag rendered by the component. */
  tag: Tag
  /** Base class names applied to the component. */
  baseClassNames: string[]
  /** Test identifier for the component. */
  testId: string
  /** Optional tweaks applied to the rendered element. */
  applyElementProps?: (
    props: BoundTextFieldProps<Tag>
  ) => Partial<BoundTextFieldAttributes<Tag>>
}

/**
 * Factory that creates components for bound text fields such as inputs and textareas.
 *
 * The generated component connects the field to the game state using
 * {@link useBoundField}, merges shared props, and wires the standard `onInput`
 * handler that persists the field value unless the event is prevented.
 *
 * @template Tag Element tag rendered by the bound text field.
 * @param options - Factory options configuring the rendered element.
 * @returns A component rendering the configured bound text field.
 */
export const createBoundTextField = <Tag extends 'input' | 'textarea'>({
  tag,
  baseClassNames,
  testId,
  applyElementProps
}: CreateBoundTextFieldOptions<Tag>) => {
  const ElementTag = tag
  const BoundTextField = (props: BoundTextFieldProps<Tag>) => {
    const {
      stateKey,
      className,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onInput,
      initialValue,
      disabled,
      ...rest
    } = props

    const { value, setValue, isDisabled, directiveEvents } =
      useBoundField<string>({
        stateKey,
        initialValue: initialValue ?? '',
        disabled,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur
      })

    const elementProps = applyElementProps?.(props) ?? {}

    const handleInput: JSX.GenericEventHandler<
      BoundTextFieldElement<Tag>
    > = event => {
      onInput?.(event)
      if (event.defaultPrevented) return
      const target = event.currentTarget as BoundTextFieldElement<Tag>
      setValue(target.value)
    }

    const mergedProps = {
      'data-testid': testId,
      className: mergeClasses(...baseClassNames, className),
      value: value ?? '',
      disabled: isDisabled,
      ...rest,
      ...elementProps,
      ...directiveEvents,
      onInput: handleInput
    } satisfies BoundTextFieldAttributes<Tag>

    return h(ElementTag, mergedProps)
  }

  return BoundTextField
}
