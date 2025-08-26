import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Select'
}

export default meta

/**
 * Demonstrates the `select` directive bound to game state.
 *
 * @returns Campfire story showcasing the `select` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::select[color]
:option{value="red" label="Red"}
:option{value="blue" label="Blue"}
:::
:::if[color]
You chose :show[color].
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates the `select` directive with event directives.
 *
 * @returns Campfire story showcasing select events.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::select[color]
:option{value="red" label="Red"}
:option{value="blue" label="Blue"}
:::onFocus
  :set[focused=true]
:::
:::onBlur
  :unset[focused]
:::
:::if[focused]
Focused!
:::
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
