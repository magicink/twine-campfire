import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

/**
 * Arguments for the {@link MultiPassage} story.
 */
interface MultiPassageArgs {
  firstDeckFirstX: number
  firstDeckFirstY: number
  firstDeckFirstW: number
  firstDeckFirstSize: number
  firstDeckSecondX: number
  firstDeckSecondY: number
  firstDeckSecondW: number
  firstDeckSecondSize: number
  secondDeckFirstX: number
  secondDeckFirstY: number
  secondDeckFirstW: number
  secondDeckFirstSize: number
  secondDeckSecondX: number
  secondDeckSecondY: number
  secondDeckSecondW: number
  secondDeckSecondSize: number
}

const meta: Meta<MultiPassageArgs> = {
  title: 'Campfire/Directives/Deck',
  argTypes: {
    firstDeckFirstX: { control: { type: 'number' } },
    firstDeckFirstY: { control: { type: 'number' } },
    firstDeckFirstW: { control: { type: 'number' } },
    firstDeckFirstSize: { control: { type: 'number' } },
    firstDeckSecondX: { control: { type: 'number' } },
    firstDeckSecondY: { control: { type: 'number' } },
    firstDeckSecondW: { control: { type: 'number' } },
    firstDeckSecondSize: { control: { type: 'number' } },
    secondDeckFirstX: { control: { type: 'number' } },
    secondDeckFirstY: { control: { type: 'number' } },
    secondDeckFirstW: { control: { type: 'number' } },
    secondDeckFirstSize: { control: { type: 'number' } },
    secondDeckSecondX: { control: { type: 'number' } },
    secondDeckSecondY: { control: { type: 'number' } },
    secondDeckSecondW: { control: { type: 'number' } },
    secondDeckSecondSize: { control: { type: 'number' } }
  },
  args: {
    firstDeckFirstX: 20,
    firstDeckFirstY: 20,
    firstDeckFirstW: 100,
    firstDeckFirstSize: 24,
    firstDeckSecondX: 20,
    firstDeckSecondY: 60,
    firstDeckSecondW: 100,
    firstDeckSecondSize: 24,
    secondDeckFirstX: 20,
    secondDeckFirstY: 20,
    secondDeckFirstW: 100,
    secondDeckFirstSize: 24,
    secondDeckSecondX: 20,
    secondDeckSecondY: 40,
    secondDeckSecondW: 100,
    secondDeckSecondSize: 24
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
    firstDeckFirstW,
    firstDeckFirstSize,
    firstDeckSecondX,
    firstDeckSecondY,
    firstDeckSecondW,
    firstDeckSecondSize,
    secondDeckFirstX,
    secondDeckFirstY,
    secondDeckFirstW,
    secondDeckFirstSize,
    secondDeckSecondX,
    secondDeckSecondY,
    secondDeckSecondW,
    secondDeckSecondSize
  }) => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size='400x300'}
  :::slide

    [[Next->Second]]

    :::reveal{at=0}
      :::text{x=${firstDeckFirstX} y=${firstDeckFirstY} w=${firstDeckFirstW} size=${firstDeckFirstSize}}
      First deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=${firstDeckSecondX} y=${firstDeckSecondY} w=${firstDeckSecondW} size=${firstDeckSecondSize}}
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
      :::text{x=${secondDeckFirstX} y=${secondDeckFirstY} w=${secondDeckFirstW} size=${secondDeckFirstSize}}
      Second deck 1
      :::
    :::

    :::reveal{at=1}
      :::text{x=${secondDeckSecondX} y=${secondDeckSecondY} w=${secondDeckSecondW} size=${secondDeckSecondSize}}
      Second deck 2
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire data-testid='campfire' />
    </>
  )
}
