import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

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
:::deck{size='400x300'}
  :::slide

    [[Next->Second]]

    :::reveal{at=0}
      :::text{x=20 y=20}
      First deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=20 y=60}
      First deck 2
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='2' name='Second'>
          {`
:::deck{size='400x300'}
  :::slide

    [[Back->Start]]

    :::reveal{at=0}
      :::text{x=20 y=20}
      Second deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=20 y=40}
      Second deck 2
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
