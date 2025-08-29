import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Deck'
}

export default meta

/**
 * Uses directives to create a deck with a single passage of slides.
 *
 * @returns Campfire story demonstrating the `deck` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:preset{type="text" name="title" x=80 y=80 as="p" size=36}

:::deck{size='800x600' groupClassName='rounded-none shadow-none' navClassName='justify-between' hudClassName='left-3 right-auto' showSlideCount}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{from="title"}
      Hello
      :::
    :::
      :::reveal{at=1}
      :shape{x=150 y=150 w=100 h=50 type='rect' stroke='blue' fill='#ddf' radius=8 shadow=true className='opacity-25'}
      :::
    :::reveal{at=2}
      :::text{from="title" x=100 y=100}
      World
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
