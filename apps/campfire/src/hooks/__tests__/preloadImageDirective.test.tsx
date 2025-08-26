import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { render } from '@testing-library/preact'
import type { Parent } from 'mdast'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { ImageManager } from '@campfire/image/ImageManager'
import type { FunctionComponent } from 'preact'

let handlers: Record<string, DirectiveHandler>

/**
 * Component that captures directive handlers for testing.
 *
 * @returns Nothing.
 */
const HandlerGrabber: FunctionComponent = () => {
  handlers = useDirectiveHandlers()
  return null
}

beforeEach(() => {
  render(<HandlerGrabber />)
})

describe('preloadImage directive', () => {
  it('preloads images via ImageManager', () => {
    const spy = spyOn(ImageManager.getInstance(), 'load').mockResolvedValue()
    const directive = {
      type: 'leafDirective',
      name: 'preloadImage',
      attributes: { src: 'logo.png' },
      label: 'logo'
    } as any
    const parent: Parent = { type: 'root', children: [directive] }
    handlers.preloadImage!(directive, parent, 0)
    runDirectiveBlock(parent.children as any, handlers)
    expect(spy).toHaveBeenCalledWith('logo', 'logo.png')
    spy.mockRestore()
  })
})
