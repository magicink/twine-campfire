import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { Modal } from '../src/Modal'
import { useGameStore } from '@/packages/use-game-store'

const resetStore = () => {
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
}

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStore()
  })

  it('closes and updates game state on backdrop click', () => {
    useGameStore.setState(state => ({ ...state, gameData: { modal: true } }))
    render(<Modal open='modal'>content</Modal>)
    const dialog = screen.getByRole('dialog') as HTMLDialogElement
    expect(dialog.hasAttribute('open')).toBe(true)

    act(() => {
      dialog.click()
    })

    expect(dialog.hasAttribute('open')).toBe(false)
    expect(useGameStore.getState().gameData.modal).toBe(false)
  })

  it('updates game state when cancel event fires', () => {
    useGameStore.setState(state => ({ ...state, gameData: { modal: true } }))
    render(<Modal open='modal'>content</Modal>)
    const dialog = screen.getByRole('dialog') as HTMLDialogElement

    act(() => {
      dialog.dispatchEvent(new Event('cancel'))
    })

    expect(useGameStore.getState().gameData.modal).toBe(false)
  })
})
