import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from './DebugWindow'

const meta: Meta = {
  title: 'Campfire/Directives/For'
}

export default meta

/**
 * Iterates over a numeric array using the `for` directive and displays each
 * value.
 *
 * @returns Campfire story demonstrating numeric iteration with `show`.
 */
export const Numbers: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::for[x in [1,2,3]]

Value :show[x]{as="span" className="text-sky-600"}

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
 * Iterates over an array of fruits using the `for` directive and skips
 * bananas via a nested `if` directive.
 *
 * @returns Campfire story demonstrating the `for` directive.
 */
export const Fruits: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::array[fruits=["apple","banana","cherry"]]

:::for[fruit in fruits]

  :::if[fruit !== "banana"]

  - :show[fruit]{as="span" className="text-rose-600"}

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
