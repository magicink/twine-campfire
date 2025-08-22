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
:::deck{size='9x16'}
  :::slide
    :::reveal{at=0}
      :::layer{x=0 y=0 className="flex h-full w-full items-center justify-center"}
        :::text{align='center'}
        Splash Screen 1
        :::
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
