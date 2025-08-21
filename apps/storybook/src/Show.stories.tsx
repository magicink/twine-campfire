import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Show } from '@campfire/components'
import { useGameStore } from '@campfire/state/useGameStore'

const meta: Meta<typeof Show> = {
  component: Show,
  title: 'Campfire/Show'
}

export default meta

/**
 * Displays values from game data and the result of an expression.
 *
 * @returns Examples of the Show component.
 */
export const Examples: StoryObj<typeof Show> = {
  render: () => {
    useGameStore.getState().setGameData({ hp: 2 })
    return (
      <div className='flex flex-col gap-2'>
        <span>
          HP: <Show data-key='hp' />
        </span>
        <span>
          Expression: <Show data-expr='hp > 1 ? "X" : " "' />
        </span>
      </div>
    )
  }
}
