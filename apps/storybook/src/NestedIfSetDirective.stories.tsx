import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/NestedIfSet'
}

export default meta

/**
 * Demonstrates deeply nested `if` and `set` directives within
 * `deck`, `slide`, `layer`, and `trigger` containers.
 *
 * @returns Campfire story showcasing nested directives with multiple
 * siblings and triggers.
 */
export const DeepNesting: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
:::slide
before outer layer
:::layer{x=40 y=40 className="flex flex-col gap-[8px]"}
before outer trigger
:::trigger{label="outer"}
::set[outer=true]
:::

:::if[outer]
before inner layer
:::layer{x=280 y=40 className="flex flex-col gap-[8px]"}
:::trigger{label="inner one"}
::set[inner=true]
:::

:::if[inner]
inner hit
:::trigger{label="inner off"}
::set[inner=false]
:::

:::trigger{label="inner two"}
::set[inner2=true]
:::

:::if[inner2]
inner2 hit
:::trigger{label="inner two off"}
::set[inner2=false]
:::
:::

:::trigger{label="outer off"}
::set[outer=false]
:::
:::

:::layer{x=40 y=240}
sibling layer after outer
:::
:::
:::slide
second slide
:::
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
