import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, renderDirectiveMarkdown } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Markdown/Radio'
}

export default meta

const markdown = `
<form>
  <input type="radio" name="group" checked> Option A
  <input type="radio" name="group"> Option B
</form>
`

/**
 * Demonstrates rendering Markdown radio inputs as styled buttons.
 *
 * @returns Deck with a slide showing the radios.
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
