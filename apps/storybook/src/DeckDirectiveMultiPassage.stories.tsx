import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

/**
 * Arguments for the {@link MultiPassage} story.
 */
interface MultiPassageArgs {
  firstDeckFirstX: number
  firstDeckFirstY: number
  firstDeckSecondX: number
  firstDeckSecondY: number
  secondDeckFirstX: number
  secondDeckFirstY: number
  secondDeckSecondX: number
  secondDeckSecondY: number
}

const meta: Meta<MultiPassageArgs> = {
  title: 'Campfire/Directives/Deck',
  argTypes: {
    firstDeckFirstX: { control: { type: 'number' } },
    firstDeckFirstY: { control: { type: 'number' } },
    firstDeckSecondX: { control: { type: 'number' } },
    firstDeckSecondY: { control: { type: 'number' } },
    secondDeckFirstX: { control: { type: 'number' } },
    secondDeckFirstY: { control: { type: 'number' } },
    secondDeckSecondX: { control: { type: 'number' } },
    secondDeckSecondY: { control: { type: 'number' } }
  },
  args: {
    firstDeckFirstX: 20,
    firstDeckFirstY: 20,
    firstDeckSecondX: 20,
    firstDeckSecondY: 60,
    secondDeckFirstX: 20,
    secondDeckFirstY: 20,
    secondDeckSecondX: 20,
    secondDeckSecondY: 40
  }
}

export default meta

/**
 * Story with two passages, each containing its own deck of slides.
 *
 * @returns Campfire story showcasing decks across multiple passages.
 */
export const MultiPassage: StoryObj<MultiPassageArgs> = {
  render: ({
    firstDeckFirstX,
    firstDeckFirstY,
    firstDeckSecondX,
    firstDeckSecondY,
    secondDeckFirstX,
    secondDeckFirstY,
    secondDeckSecondX,
    secondDeckSecondY
  }) => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size='400x300'}
  :::slide

    [[Next->Second]]

    :::reveal{at=0}
      :::text{x=${firstDeckFirstX} y=${firstDeckFirstY}}
      First deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=${firstDeckSecondX} y=${firstDeckSecondY}}
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
      :::text{x=${secondDeckFirstX} y=${secondDeckFirstY}}
      Second deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=${secondDeckSecondX} y=${secondDeckSecondY}}
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
