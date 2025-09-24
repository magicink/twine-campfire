import type { Meta, StoryObj } from '@storybook/preact'
import { Deck, Slide, renderDirectiveMarkdown } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Markdown/Table'
}

export default meta

const markdown = `
| Planet | Diameter (km) |
| ------ | :-------------: |
| Mercury | 4,879 |
| Venus | 12,104 |
| Earth | 12,742 |
`

/**
 * Demonstrates rendering a styled Markdown table.
 *
 * @returns Deck with a slide showing the table.
 */
export const Basic: StoryObj = {
  render: () => (
    <Deck className='w-[800px] h-[600px]' hideNavigation>
      <Slide
        className={
          'absolute bottom-0 !w-1/2 -translate-x-[50%] -translate-y-[10%] top-[50%] left-[50%]'
        }
      >
        {renderDirectiveMarkdown(markdown, {})}
      </Slide>
    </Deck>
  )
}
