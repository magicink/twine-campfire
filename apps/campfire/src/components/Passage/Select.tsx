import type { JSX, VNode } from 'preact'
import { cloneElement, toChildArray } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import rfdc from 'rfdc'
import type { RootContent } from 'mdast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useGameStore } from '@campfire/state/useGameStore'
import type { OptionProps } from './Option'

const clone = rfdc()

interface SelectProps
  extends Omit<
    JSX.HTMLAttributes<HTMLButtonElement>,
    'className' | 'onInput' | 'onFocus' | 'onBlur' | 'onMouseEnter'
  > {
  /** Key in game state to bind the select value to. */
  stateKey: string
  /** Additional CSS classes for the select element. */
  className?: string | string[]
  /** Serialized directives to run when hovered. */
  onHover?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Optional input event handler. */
  onInput?: JSX.HTMLAttributes<HTMLButtonElement>['onInput']
  /** Initial value if the state key is unset. */
  initialValue?: string
}

/**
 * Select element bound to a game state key. Updates the key on selection change.
 *
 * @param stateKey - Key in game state to store the selected value.
 * @param className - Optional additional classes.
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param style - Optional inline styles for the select element.
 * @param rest - Additional select element attributes.
 * @returns The rendered select element.
 */
export const Select = ({
  stateKey,
  className,
  onHover,
  onFocus,
  onBlur,
  onInput,
  style,
  children,
  initialValue,
  ...rest
}: SelectProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const setGameData = useGameStore(state => state.setGameData)
  const handlers = useDirectiveHandlers()
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (value === undefined) {
      setGameData({ [stateKey]: initialValue ?? '' })
    }
  }, [value, stateKey, initialValue, setGameData])
  const mergedStyle =
    typeof style === 'string'
      ? `border:1px solid oklch(0 0 0);color:oklch(0 0 0);background:oklch(1 0 0);${style}`
      : {
          border: '1px solid oklch(0 0 0)',
          color: 'oklch(0 0 0)',
          background: 'oklch(1 0 0)',
          ...(style ?? {})
        }
  const optionNodes = toChildArray(children) as VNode<OptionProps>[]
  const selected = optionNodes.find(opt => opt.props.value === value)
  const handleSelect = (val: string) => {
    setGameData({ [stateKey]: val })
    onInput?.({} as any)
    setOpen(false)
  }
  return (
    <div style={{ display: 'inline-block' }}>
      <button
        data-testid='select'
        className={['campfire-select', ...classes].join(' ')}
        style={mergedStyle}
        value={value ?? ''}
        {...rest}
        onMouseEnter={e => {
          if (onHover) {
            runDirectiveBlock(
              clone(JSON.parse(onHover)) as RootContent[],
              handlers
            )
          }
        }}
        onFocus={e => {
          if (onFocus) {
            runDirectiveBlock(
              clone(JSON.parse(onFocus)) as RootContent[],
              handlers
            )
          }
        }}
        onBlur={e => {
          if (onBlur) {
            runDirectiveBlock(
              clone(JSON.parse(onBlur)) as RootContent[],
              handlers
            )
          }
        }}
        onClick={() => setOpen(prev => !prev)}
      >
        {selected ? selected.props.children : ''}
      </button>
      {open && (
        <div role='listbox'>
          {optionNodes.map(opt =>
            cloneElement(opt, {
              onSelectOption: handleSelect
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Select
