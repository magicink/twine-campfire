import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Textarea'
}

export default meta

/**
 * Demonstrates the `textarea` directive bound to game state.
 *
 * @returns Campfire story showcasing the `textarea` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:textarea[bio]{placeholder="Enter bio"}
:::if[bio]

You wrote: :show[bio]{className="text-purple-600"}

:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates the `textarea` directive with event directives.
 *
 * @returns Campfire story showcasing textarea events.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::textarea[bio]{placeholder="Hover or focus"}
:::onFocus
  :set[focused=true]
:::
:::onBlur
  :unset[focused]
:::
:::if[focused]

Focused!

:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
