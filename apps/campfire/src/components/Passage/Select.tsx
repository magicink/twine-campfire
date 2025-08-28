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
  /** Text shown when no option is selected. */
  label?: string
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
 * @param label - Text shown when no option is selected.
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
  label,
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
        className={[
          'campfire-select',
          "inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3",
          ...classes
        ].join(' ')}
        style={style}
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
        {selected ? selected.props.children : (label ?? '')}
        <svg
          aria-hidden='true'
          className='ml-2'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          stroke-width='2'
          stroke-linecap='round'
          stroke-linejoin='round'
        >
          <path d='m6 9 6 6 6-6' />
        </svg>
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
