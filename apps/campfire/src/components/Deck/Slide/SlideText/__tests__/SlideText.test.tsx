import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { SlideText } from '@campfire/components/Deck/Slide'

describe('SlideText', () => {
  it('renders the specified HTML tag', () => {
    render(<SlideText as='h2'>Hello</SlideText>)
    const wrapper = screen.getByTestId('slideText') as HTMLElement
    const el = wrapper.firstElementChild as HTMLElement
    expect(el.tagName).toBe('H2')
  })

  it('forwards positioning props to Layer', () => {
    render(
      <SlideText x={10} y={20} w={100} h={50}>
        Positioned
      </SlideText>
    )
    const wrapper = screen.getByTestId('slideText') as HTMLElement
    expect(wrapper.style.left).toBe('10px')
    expect(wrapper.style.top).toBe('20px')
    expect(wrapper.style.width).toBe('100px')
    expect(wrapper.style.height).toBe('50px')
  })

  it('applies custom typography styles', () => {
    render(
      <SlideText
        size={24}
        weight={700}
        align='center'
        color='red'
        lineHeight={1.5}
      >
        Styled
      </SlideText>
    )
    const el = screen.getByText('Styled') as HTMLElement
    expect(el.style.fontSize).toBe('24px')
    expect(el.style.fontWeight).toBe('700')
    expect(el.style.textAlign).toBe('center')
    expect(el.style.color).toBe('red')
    expect(el.style.lineHeight).toBe('1.5')
  })
})
