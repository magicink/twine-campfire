import type { Meta, StoryObj } from '@storybook/preact'
import { LoadingScreen } from '@campfire/components/LoadingScreen'

const meta: Meta<typeof LoadingScreen> = {
  component: LoadingScreen,
  title: 'Campfire/Components/LoadingScreen'
}

export default meta

export const Default: StoryObj<typeof LoadingScreen> = {
  args: {
    assets: [],
    targetPassage: 'Intro'
  }
}
