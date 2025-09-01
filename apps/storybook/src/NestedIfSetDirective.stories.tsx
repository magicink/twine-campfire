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
:::deck
:::slide
before outer layer
:::layer
before outer trigger
:::trigger{label="outer"}
before outer set
:::set[outer=true]
:::
between outer set and if
:::if[outer]
before inner layer
:::layer
sibling before inner trigger one
:::trigger{label="inner one"}
before inner set
:::set[inner=true]
:::
between inner set and if
:::if[inner]
inner hit
:::
after inner if
:::
between inner triggers
:::trigger{label="inner two"}
before inner2 set
:::set[inner2=true]
:::
between inner2 set and if
:::if[inner2]
inner2 hit
:::
after inner2 if
:::
after inner triggers
:::
after inner layer
:::
after outer if
:::
after outer trigger
:::
after outer layer
:::layer
sibling layer after outer
:::
end slide
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
