import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS configuration for the Storybook workspace.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../campfire/src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
}

export default config
