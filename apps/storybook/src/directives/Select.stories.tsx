import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

const meta: Meta = {
  title: 'Campfire/Directives/Select'
}

export default meta

/**
 * Demonstrates the `select` directive bound to game state with keyboard navigation.
 *
 * @returns Campfire story showcasing the `select` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:::select[color]{label="Choose a color"}

::option{value="red" label="Red"}
::option{value="blue" label="Blue"}

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
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
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
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:::select[color]{label="Choose a color"}

::option{value="red" label="Red"}
::option{value="blue" label="Blue"}

:::onFocus
  ::set[focused=true]
:::

:::onBlur
  ::unset[focused]
:::

:::

:::if[focused]

Focused!

:::

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
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
