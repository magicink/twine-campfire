import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { Text } from '@campfire/components/Text/Text'

describe('Text', () => {
  it('renders the specified HTML tag', () => {
    render(<Text as='h2' content='Hello' />)
    const el = screen.getByText('Hello') as HTMLElement
    expect(el.tagName).toBe('H2')
  })

  it('forwards positioning props to Layer', () => {
    render(<Text x={10} y={20} w={100} h={50} content='Positioned' />)
    const wrapper = screen.getByText('Positioned').parentElement as HTMLElement
    expect(wrapper.style.left).toBe('10px')
    expect(wrapper.style.top).toBe('20px')
    expect(wrapper.style.width).toBe('100px')
    expect(wrapper.style.height).toBe('50px')
  })

  it('applies custom typography styles', () => {
    render(
      <Text
        size={24}
        weight={700}
        align='center'
        color='red'
        lineHeight={1.5}
        content='Styled'
      />
    )
    const el = screen.getByText('Styled') as HTMLElement
    expect(el.style.fontSize).toBe('24px')
    expect(el.style.fontWeight).toBe('700')
    expect(el.style.textAlign).toBe('center')
    expect(el.style.color).toBe('red')
    expect(el.style.lineHeight).toBe('1.5')
  })

  it('prefers children over content', () => {
    render(<Text content='Fallback'>Child</Text>)
    expect(screen.getByText('Child')).toBeTruthy()
    expect(screen.queryByText('Fallback')).toBeNull()
  })
})
