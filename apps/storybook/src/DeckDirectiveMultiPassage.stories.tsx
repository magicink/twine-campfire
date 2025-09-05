import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from './DebugWindow'

const meta: Meta = {
  title: 'Campfire/Directives/Deck'
}

export default meta

/**
 * Story with two passages, each containing its own deck of slides.
 *
 * @returns Campfire story showcasing decks across multiple passages.
 */
export const MultiPassage: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size='1280x720'}
  :::slide

    :::layer{x=40 y=250 w=100 h=100}
    [[Next->Second]]
    :::

    :::reveal{at=0}
      :::text{x=20 y=20 w=200 size=24}
      First deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=20 y=60 w=200 size=24}
      First deck 2
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='2' name='Second'>
          {`
:::deck{size='1280x720'}
  :::slide

    :::layer{x=40 y=250 w=100 h=100}
    [[Back->Start]]
    :::

    :::reveal{at=0}
      :::text{x=20 y=20 w=200 size=24}
      Second deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=20 y=60 w=200 size=24}
      Second deck 2
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire data-testid='campfire' />
      <DebugWindow />
    </>
  )
}
