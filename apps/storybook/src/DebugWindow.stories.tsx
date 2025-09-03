import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { DebugWindow } from '@campfire/components'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import i18next from 'i18next'

const meta: Meta<typeof DebugWindow> = {
  component: DebugWindow,
  title: 'Campfire/Components/DebugWindow'
}

export default meta

/**
 * Displays the debug window component.
 */
export const Default: StoryObj<typeof DebugWindow> = {
  render: () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    if (!i18next.isInitialized) {
      void i18next.init({ lng: 'en-US', resources: {} })
    }
    return <DebugWindow />
  }
}
