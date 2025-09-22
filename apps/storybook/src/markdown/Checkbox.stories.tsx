import type { Meta, StoryObj } from '@storybook/preact'
import { Deck, Slide, renderDirectiveMarkdown } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Markdown/Checkbox'
}

export default meta

const markdown = `
- [ ] Unchecked item
- [x] Checked item
`

/**
 * Demonstrates rendering Markdown checkboxes as styled buttons.
 *
 * @returns Deck with a slide showing the checkboxes.
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
