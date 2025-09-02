import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Checkbox } from '@campfire/components'

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: 'Campfire/Components/Checkbox'
}

export default meta

/**
 * Displays a basic Checkbox bound to game state.
 *
 * @returns A Checkbox example.
 */
export const Basic: StoryObj<typeof Checkbox> = {
  render: () => <Checkbox stateKey='agree' /> // simple example
}
