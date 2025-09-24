import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

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
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid={'2'} name={'overlay-1'} tags={'overlay'} hidden>
          {`
:::wrapper{className='bg-white/50 text-black absolute bottom-4 left-4 p-4 rounded shadow-lg'}
Overlay Text
:::

:::wrapper{className='bg-white/50 text-black absolute top-4 left-4 p-4 rounded shadow-lg'}
Overlay Text2
:::
`}
        </TwPassagedata>
        <TwPassagedata pid='1' name='Start'>
          {`
:preset{type="text" name="title" x=80 y=80 as="p" size=36}

:::deck{size='800x600' groupClassName='rounded-none shadow-none' navClassName='justify-between' hudClassName='left-3 right-auto' rewindButtonClassName='bg-[var(--color-indigo-600)]' playButtonClassName='bg-[var(--color-red-600)]' fastForwardButtonClassName='bg-[var(--color-indigo-600)]' slideHudClassName='font-bold' showSlideCount}
  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{from="title"}
        Hello
      :::
    :::
    :::reveal{at=1}
      :shape{x=150 y=150 w=100 h=50 z=-10 type='rect' stroke='blue' fill='#ddf' radius=8 shadow=true className='opacity-25'}
    :::
    :::reveal{at=2}
      :::text{from="title" x=100 y=100}
        World
      :::
    :::
  :::

  :::slide{transition='fade'}
    :::reveal{at=0}
      :::text{from="title"}
      Paused 1
      :::
    :::
    :::reveal{at=1}
      :::text{from="title" x=100 y=100}
      2nd Slide
      :::
    :::
    :::reveal{at=2}
      :::text{from="title" x=150 y=150}
      3rd Slide
      :::
    :::reveal{at=3}
      :::text{from="title" x=200 y=200}
      The End
      :::
    :::
  :::
:::
`}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
