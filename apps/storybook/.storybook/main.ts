import path from 'node:path'
import type { StorybookConfig } from '@storybook/preact-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/preact-vite',
    options: {}
  },
  /**
   * Extends Storybook's Vite configuration to resolve `@campfire` imports.
   *
   * @param config - The existing Vite configuration.
   * @returns The updated configuration with the `@campfire` alias.
   */
  viteFinal: async config => {
    config.resolve ??= {}
    config.resolve.alias = [
      ...(config.resolve.alias ?? []),
      {
        find: '@campfire',
        replacement: path.resolve(__dirname, '../../campfire/src')
      }
    ]

    return config
  }
}

export default config
