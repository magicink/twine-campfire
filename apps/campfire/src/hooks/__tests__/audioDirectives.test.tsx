import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { render } from '@testing-library/preact'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { AudioManager } from '@campfire/audio/AudioManager'
import type { FunctionComponent } from 'preact'

let handlers: Record<string, DirectiveHandler>
let audio: AudioManager

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
  audio = AudioManager.getInstance()
  render(<HandlerGrabber />)
})

describe('audio directives', () => {
  it('plays sound effects', () => {
    const spy = spyOn(audio, 'playSfx').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(":sound[click]{src='click.wav' volume=0.5 delay=100}")
      .children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('controls background music', () => {
    const spy = spyOn(audio, 'playBgm').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(":bgm[theme]{src='theme.mp3' volume=0.4 loop=false fade=200}")
      .children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('plays sound effects from src only', () => {
    const spy = spyOn(audio, 'playSfx').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(":sound{src='beep.mp3'}").children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toBe('beep.mp3')
    spy.mockRestore()
  })

  it('plays background music from src only', () => {
    const spy = spyOn(audio, 'playBgm').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(":bgm{src='ambient.mp3'}").children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toBe('ambient.mp3')
    spy.mockRestore()
  })

  it('stops background music', () => {
    const spy = spyOn(audio, 'stopBgm').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':bgm{stop=true fade=300}').children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(spy).toHaveBeenCalledWith(300)
    spy.mockRestore()
  })

  it('sets volume levels', () => {
    const bgmSpy = spyOn(audio, 'setBgmVolume').mockImplementation(() => {})
    const sfxSpy = spyOn(audio, 'setSfxVolume').mockImplementation(() => {})
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':volume{bgm=0.2 sfx=0.7}').children as RootContent[]
    runDirectiveBlock(nodes, handlers)
    expect(bgmSpy).toHaveBeenCalledWith(0.2)
    expect(sfxSpy).toHaveBeenCalledWith(0.7)
    bgmSpy.mockRestore()
    sfxSpy.mockRestore()
  })
})

describe('AudioManager', () => {
  it('scales track volume by global level', () => {
    const manager = AudioManager.getInstance()
    const fake = { volume: 0 } as HTMLAudioElement
    ;(manager as unknown as { bgm: HTMLAudioElement | undefined }).bgm = fake
    ;(manager as unknown as { bgmBaseVolume: number }).bgmBaseVolume = 0.5
    manager.setBgmVolume(0.8)
    expect(fake.volume).toBeCloseTo(0.4)
    ;(manager as unknown as { bgm: HTMLAudioElement | undefined }).bgm =
      undefined
    ;(manager as unknown as { bgmBaseVolume: number }).bgmBaseVolume = 1
  })
})
