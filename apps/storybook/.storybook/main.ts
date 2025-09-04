import path from 'node:path'
import { indexer } from '@storybook/mdx2-csf'
import type { StorybookConfig } from '@storybook/preact-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs'],
  indexers: async existing => [...existing, indexer],
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
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@campfire': path.resolve(__dirname, '../../campfire/src')
    }
    config.build ??= {}
    config.build.sourcemap = true
    return config
  }
}

export default config
