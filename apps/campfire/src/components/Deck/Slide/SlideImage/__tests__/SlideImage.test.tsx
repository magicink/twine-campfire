import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { SlideImage } from '@campfire/components/Deck/Slide'

describe('SlideImage', () => {
  it('renders an img with the given src and alt', () => {
    render(<SlideImage src='img.png' alt='test image' />)
    const wrapper = screen.getByTestId('slideImage') as HTMLElement
    const img = wrapper.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('img.png')
    expect(img.alt).toBe('test image')
  })

  it('forwards positioning props to Layer', () => {
    render(<SlideImage src='img.png' alt='test' x={10} y={20} w={100} h={50} />)
    const wrapper = screen.getByTestId('slideImage') as HTMLElement
    expect(wrapper.style.left).toBe('10px')
    expect(wrapper.style.top).toBe('20px')
    expect(wrapper.style.width).toBe('100px')
    expect(wrapper.style.height).toBe('50px')
  })

  it('applies custom class and style', () => {
    render(
      <SlideImage
        src='img.png'
        alt='styled'
        className='rounded'
        style='border: 1px solid red;'
      />
    )
    const img = screen.getByAltText('styled') as HTMLImageElement
    expect(img.className).toContain('rounded')
    expect(img.style.border).toBe('1px solid red')
  })
})
