import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/If'
}

export default meta

/**
 * Shows content when the condition is true.
 *
 * @returns Campfire story demonstrating `if` with a truthy value.
 */
export const Truthy: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[flag=true]

:::if[flag]
Flag is true
:::else
Flag is false
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Shows fallback content when the condition is false.
 *
 * @returns Campfire story demonstrating `if` with a falsy value.
 */
export const Falsy: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[flag=false]

:::if[flag]
Flag is true
:::else
Flag is false
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
