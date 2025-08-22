import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Games/Attendant'
}

export default meta

/**
 * Barebones Attendant game with a splash screen.
 *
 * @returns Campfire story rendering the initial splash screen.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size='9x16' autoplay=true hideNavigation=true}
  :::slide
    :::reveal{at=0}
      :::text{x=540 y=960 anchor='center' align='center'}
      Splash Screen 1
      :::
    :::
  :::
  :::slide
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire data-testid='campfire' />
    </>
  )
}
