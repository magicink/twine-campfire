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
:::select[color]{label="Choose a color"}

:option{value="red" label="Red"}
:option{value="blue" label="Blue"}

:::

This text follows the select.

:::if[color]

You chose
:::

  :::if[color === "red"]

  :show[color]{style="color: var(--color-destructive-500)"}.

:::

  :::if[color === "blue"]

  :show[color]{style="color: var(--color-primary-500)"}.

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
:::select[color]{label="Choose a color"}

:option{value="red" label="Red"}
:option{value="blue" label="Blue"}

:::onFocus
  ::set[focused=true]
:::

:::onBlur
  ::unset[focused]
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
