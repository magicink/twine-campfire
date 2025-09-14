import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from './DebugWindow'

const meta: Meta = {
  title: 'Campfire/Directives/Switch'
}

export default meta

/**
 * Renders the matching case.
 *
 * @returns Campfire story demonstrating `switch` with a matching case.
 */
export const MatchingCase: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[color="red"]

:::switch[color]
:::case["red"]
Red
:::
:::case["blue"]
Blue
:::
:::default
No match
:::
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}

/**
 * Falls back to default when no case matches.
 *
 * @returns Campfire story demonstrating `switch` default fallback.
 */
export const DefaultCase: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[color="green"]

:::switch[color]
:::case["red"]
Red
:::
:::case["blue"]
Blue
:::
:::default
No match
:::
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
