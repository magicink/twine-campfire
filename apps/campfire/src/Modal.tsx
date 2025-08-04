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
    if (e.target === e.currentTarget && open) {
      if (
        dialogRef.current?.open &&
        typeof dialogRef.current.close === 'function'
      ) {
        try {
          dialogRef.current.close()
        } catch {
          dialogRef.current.removeAttribute('open')
        }
      }
      setGameData({ [open]: false })
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
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        try {
          dialog.close()
        } catch {
          dialog.removeAttribute('open')
        }
      } else {
        dialog.removeAttribute('open')
      }
    }
  }, [isOpen])

  return (
    <>
      <dialog
        ref={dialogRef}
        className={['campfire-modal', 'bg-white', 'rounded', ...classes].join(
          ' '
        )}
        onClick={handleClick}
      >
        {children}
      </dialog>
      <style>{`dialog.campfire-modal::backdrop{background-color:rgba(0,0,0,0.5);}`}</style>
    </>
  )
}
