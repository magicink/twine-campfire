import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

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
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
::set[flag=true]

:::if[flag]

Flag is true

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
 * Shows that nothing from the directive renders when the condition is false.
 *
 * @returns Campfire story demonstrating `if` with a falsy value.
 */
export const Falsy: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
::set[flag=false]

:::if[flag]

This never renders

:::

Flag remains false.
          `}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
