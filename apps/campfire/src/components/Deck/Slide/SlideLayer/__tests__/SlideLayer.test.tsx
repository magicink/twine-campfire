import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { SlideLayer } from '@campfire/components/Deck/Slide'

describe('SlideLayer', () => {
  it('renders specified element and parses style strings', () => {
    render(
      <SlideLayer
        as='p'
        testId='layer'
        style='color: rgb(0, 0, 255);'
        x={5}
        y={10}
      >
        Text
      </SlideLayer>
    )
    const wrapper = screen.getByTestId('layer') as HTMLElement
    const p = wrapper.querySelector('p') as HTMLElement
    expect(p.style.color).toBe('rgb(0, 0, 255)')
    expect(wrapper.style.left).toBe('5px')
    expect(wrapper.style.top).toBe('10px')
  })
})
