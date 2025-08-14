import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/preact-vite'

/**
 * Storybook configuration for the Campfire workspace.
 * Configures stories, addons, and Vite resolution for aliases.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/preact-vite',
    options: {}
  },
  /**
   * Adjusts the Vite configuration to resolve local workspace aliases.
   *
   * @param config - The existing Vite configuration.
   * @returns The updated Vite configuration with aliases.
   */
  viteFinal: async config => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@campfire': resolve(__dirname, '../../campfire/src')
    }
    return config
  }
}

export default config
