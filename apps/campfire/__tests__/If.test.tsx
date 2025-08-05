import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { If } from '../src/If'

const makeContent = (text: string) =>
  JSON.stringify([
    { type: 'paragraph', children: [{ type: 'text', value: text }] }
  ])

describe('If', () => {
  it('renders content when condition is true', () => {
    render(<If test='true' content={makeContent('Hello')} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders fallback when condition is false', () => {
    render(
      <If
        test='false'
        content={makeContent('Content')}
        fallback={makeContent('Fallback')}
      />
    )
    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })

  it('renders nothing when condition is false and no fallback', () => {
    const { container } = render(
      <If test='false' content={makeContent('Nope')} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
