import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { SlideEmbed } from '@campfire/components/Deck/Slide'

describe('SlideEmbed', () => {
  it('renders an iframe with the given src', () => {
    render(<SlideEmbed src='https://example.com/embed' />)
    const wrapper = screen.getByTestId('slideEmbed') as HTMLElement
    const iframe = wrapper.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.getAttribute('src')).toBe('https://example.com/embed')
    expect(iframe.className).toContain('campfire-slide-embed')
  })

  it('handles allow and allowFullScreen props', () => {
    render(
      <SlideEmbed
        src='https://example.com/embed'
        allow='autoplay'
        allowFullScreen
      />
    )
    const iframe = screen
      .getByTestId('slideEmbed')
      .querySelector('iframe') as HTMLIFrameElement
    expect(iframe.getAttribute('allow')).toBe('autoplay')
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true)
  })

  it('defaults allowFullScreen to false when not provided', () => {
    render(<SlideEmbed src='https://example.com/embed' />)
    const iframe = screen
      .getByTestId('slideEmbed')
      .querySelector('iframe') as HTMLIFrameElement
    expect(iframe.hasAttribute('allowfullscreen')).toBe(false)
  })
})
