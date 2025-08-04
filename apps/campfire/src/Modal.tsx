import type { ReactNode, MouseEvent } from 'react'
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
  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget && open) {
      setGameData({ [open]: false })
    }
  }
  return (
    <>
      <dialog
        open={isOpen}
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
