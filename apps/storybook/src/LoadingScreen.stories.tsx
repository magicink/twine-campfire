import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { LoadingScreen } from '@campfire/components'

const meta: Meta<typeof LoadingScreen> = {
  component: LoadingScreen,
  title: 'Campfire/LoadingScreen'
}

export default meta

/**
 * Demonstrates the loading screen with sample assets.
 *
 * @returns LoadingScreen example.
 */
export const Basic: StoryObj<typeof LoadingScreen> = {
  render: () => (
    <LoadingScreen
      assets={[
        { type: 'audio', id: 'click', src: 'audio/click.wav' },
        { type: 'image', id: 'title', src: 'images/title.png' }
      ]}
      targetPassage='1'
    />
  )
}
