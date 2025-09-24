import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'

const meta: Meta = {
  title: 'Campfire/Directives/Checkbox'
}

export default meta

/**
 * Demonstrates the `checkbox` directive bound to game state.
 *
 * @returns Campfire story showcasing the `checkbox` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:checkbox[agree]
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}

/**
 * Demonstrates using the `input` directive with `type="checkbox"`.
 *
 * @returns Campfire story showcasing checkbox inputs via the `input` directive.
 */
export const AsInput: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:input[agree]{type='checkbox'}
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
