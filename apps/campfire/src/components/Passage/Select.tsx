import type { JSX, VNode } from 'preact'
import { cloneElement, toChildArray } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses, evalExpression } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'
import type { OptionProps } from './Option'
import { getOptionId } from './Option'
import type { BoundFieldProps } from './BoundFieldProps'

/** Counter used to generate deterministic IDs. */
let idCounter = 0

/**
 * Generate a unique ID with the provided prefix.
 *
 * @param prefix - Prefix for the ID.
 * @returns The generated ID.
 */
const generateId = (prefix: string) => `${prefix}-${++idCounter}`
const selectStyles =
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-2 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

interface SelectProps
  extends Omit<
      JSX.HTMLAttributes<HTMLButtonElement>,
      | 'className'
      | 'onInput'
      | 'onFocus'
      | 'onBlur'
      | 'onMouseEnter'
      | 'onMouseLeave'
      | 'disabled'
    >,
    BoundFieldProps<string> {
  /** Optional input event handler. */
  onInput?: JSX.HTMLAttributes<HTMLButtonElement>['onInput']
  /** Text shown when no option is selected. */
  label?: string
}

/**
 * Select element bound to a game state key. Updates the key on selection change.
 *
 * @param stateKey - Key in game state to store the selected value.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
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
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onInput,
  style,
  children,
  initialValue,
  label,
  disabled,
  ...rest
}: SelectProps) => {
  const gameData = useGameStore.use.gameData()
  const value = gameData[stateKey] as string | undefined
  const setGameData = useGameStore.use.setGameData()
  const isDisabled = (() => {
    if (typeof disabled === 'string') {
      if (disabled === '' || disabled === 'true') return true
      if (disabled === 'false') return false
      try {
        return Boolean(evalExpression(disabled, gameData))
      } catch {
        return false
      }
    }
    return Boolean(disabled)
  })()
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const listboxIdRef = useRef<string>(generateId('listbox'))
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (value === undefined) {
      setGameData({ [stateKey]: initialValue ?? '' })
    }
  }, [value, stateKey, initialValue, setGameData])
  const optionNodes = toChildArray(children) as VNode<OptionProps>[]
  const selectedIndex = optionNodes.findIndex(opt => opt.props.value === value)
  const selected = optionNodes[selectedIndex]
  const handleSelect = (val: string) => {
    setGameData({ [stateKey]: val })
    onInput?.({} as any)
    setOpen(false)
  }
  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    } else {
      setActiveIndex(null)
    }
  }, [open, selectedIndex])
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])
  const moveActive = (direction: 1 | -1) => {
    if (!optionNodes.length) return
    setActiveIndex(prev => {
      const next =
        prev === null
          ? direction === 1
            ? 0
            : optionNodes.length - 1
          : (prev + direction + optionNodes.length) % optionNodes.length
      return next
    })
  }
  const handleKeyDown: JSX.HTMLAttributes<HTMLButtonElement>['onKeyDown'] =
    e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setActiveIndex(0)
        } else {
          moveActive(1)
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setActiveIndex(optionNodes.length - 1)
        } else {
          moveActive(-1)
        }
      } else if (e.key === 'Enter' && open && activeIndex !== null) {
        e.preventDefault()
        const opt = optionNodes[activeIndex]
        if (opt) handleSelect(opt.props.value)
      }
    }
  const activeId =
    open && activeIndex !== null
      ? getOptionId(optionNodes[activeIndex]!.props.value)
      : undefined
  return (
    <div ref={containerRef} className='inline-block relative'>
      <button
        data-testid='select'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxIdRef.current}
        aria-activedescendant={activeId}
        className={mergeClasses(
          'campfire-select',
          selectStyles,
          'items-center justify-between cursor-pointer',
          className
        )}
        style={style}
        value={value ?? ''}
        disabled={isDisabled}
        {...rest}
        {...directiveEvents}
        onClick={() => !isDisabled && setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span className='flex-1 truncate text-left pr-2'>
          {selected ? selected.props.children : (label ?? '')}
        </span>
        <span className='flex items-center shrink-0 border-l border-input pl-2'>
          <svg
            aria-hidden='true'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='h-4 w-4'
          >
            <path d='m6 9 6 6 6-6' />
          </svg>
        </span>
      </button>
      {open && (
        <div
          role='listbox'
          id={listboxIdRef.current}
          className='absolute left-0 top-full z-50 mt-1 flex w-full flex-col divide-y divide-input rounded-md border border-input bg-[oklch(0.98_0_0)] shadow-md overflow-hidden'
        >
          {optionNodes.map(opt =>
            cloneElement(opt, {
              onSelectOption: handleSelect,
              selected: opt.props.value === value
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Select
