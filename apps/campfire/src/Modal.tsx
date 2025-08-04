import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react'
import { useGameStore } from '@/packages/use-game-store'

interface ModalProps {
  open?: string
  className?: string | string[]
  children?: ReactNode
}

export const Modal = ({ open, className, children }: ModalProps) => {
  const isOpen = useGameStore(state =>
    open
      ? ((state.gameData as Record<string, unknown>)[open] as boolean) === true
      : false
  )
  const setGameData = useGameStore(state => state.setGameData)
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const dialogRef = useRef<HTMLDialogElement>(null)
  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      const dialog = dialogRef.current
      if (!dialog) return
      if (dialog.open && typeof dialog.close === 'function') {
        try {
          dialog.close()
        } catch {
          dialog.removeAttribute('open')
          dialog.dispatchEvent(new Event('close'))
        }
      } else {
        dialog.removeAttribute('open')
        dialog.dispatchEvent(new Event('close'))
      }
    }
  }
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) {
          try {
            dialog.showModal()
          } catch {
            dialog.setAttribute('open', '')
          }
        }
      } else {
        dialog.setAttribute('open', '')
        dialog.open = true
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        try {
          dialog.close()
        } catch {
          dialog.removeAttribute('open')
          dialog.open = false
        }
      } else {
        dialog.removeAttribute('open')
        dialog.open = false
      }
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return

    const handleClose = () => setGameData({ [open]: false })
    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('cancel', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('cancel', handleClose)
    }
  }, [open, setGameData])

  return (
    <>
      <dialog
        ref={dialogRef}
        className={[
          'campfire-modal',
          'bg-white',
          'rounded',
          'backdrop:black/50',
          ...classes
        ].join(' ')}
        onClick={handleClick}
      >
        {children}
      </dialog>
    </>
  )
}
