import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Trigger'
}

export default meta

/**
 * Demonstrates the `trigger` directive toggling state and cleaning up on exit.
 *
 * @returns Campfire story showcasing the `trigger` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[test=true]

:::trigger{label="Click me"}
  :set[test=false]
:::

:::if[!test]

You clicked the button!

:::

:::onExit
  :unset[test]
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates trigger events such as hover.
 *
 * @returns Campfire story showcasing trigger event directives.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[hover=false]

:::trigger{label="Hover"}
:::onHover
  :set[hover=true]
:::
:::

:::if[hover]

You hovered the button!

:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
