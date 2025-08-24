import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { SlideShape } from '@campfire/components/Deck/Slide'

describe('SlideShape', () => {
  it('renders a rectangle with styling options', () => {
    render(
      <SlideShape
        type='rect'
        x={10}
        y={20}
        w={100}
        h={50}
        stroke='red'
        fill='blue'
        radius={5}
        shadow
        style='filter: blur(2px);'
      />
    )
    const wrapper = screen.getByTestId('slideShape') as HTMLElement
    const rect = wrapper.querySelector('rect') as SVGRectElement
    const svg = wrapper.querySelector('svg') as SVGSVGElement
    const svgClass =
      typeof svg.className === 'object' ? svg.className.baseVal : svg.className
    expect(rect.getAttribute('rx')).toBe('5')
    expect(rect.getAttribute('fill')).toBe('blue')
    expect(rect.getAttribute('stroke')).toBe('red')
    expect(svgClass).toContain('campfire-slide-shape')
    expect(svg.style.filter).toContain('blur(2px)')
    expect(svg.style.filter).toContain('drop-shadow')
    expect(wrapper.style.left).toBe('10px')
    expect(wrapper.style.top).toBe('20px')
    expect(wrapper.style.width).toBe('100px')
    expect(wrapper.style.height).toBe('50px')
  })

  it('renders a line', () => {
    render(
      <SlideShape
        type='line'
        x={0}
        y={0}
        w={100}
        h={100}
        x1={0}
        y1={50}
        x2={100}
        y2={50}
        stroke='black'
      />
    )
    const wrapper = screen.getByTestId('slideShape') as HTMLElement
    const line = wrapper.querySelector('line') as SVGLineElement
    expect(line.getAttribute('x1')).toBe('0')
    expect(line.getAttribute('x2')).toBe('100')
    const svg = wrapper.querySelector('svg') as SVGSVGElement
    const svgClass =
      typeof svg.className === 'object' ? svg.className.baseVal : svg.className
    expect(svgClass).toContain('campfire-slide-shape')
  })
})
