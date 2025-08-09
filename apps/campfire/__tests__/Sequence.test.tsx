import { describe, it, expect } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { Sequence, Step, Transition } from '../src/Sequence'

describe('Sequence', () => {
  it('prompts the user to continue when autoplay is false', () => {
    render(
      <Sequence>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    expect(screen.getByText('First')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Continue to next step' })
    act(() => {
      button.click()
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('allows customizing continue button text', () => {
    render(
      <Sequence continueLabel='Next step'>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    const button = screen.getByRole('button', { name: 'Continue to next step' })
    expect(button).toHaveTextContent('Next step')
    act(() => {
      button.click()
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('advances automatically when autoplay is true', async () => {
    render(
      <Sequence autoplay>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    await screen.findByText('Second')
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('supports custom next handlers', () => {
    render(
      <Sequence>
        <Step>
          {({ next }) => (
            <button type='button' onClick={next}>
              Go
            </button>
          )}
        </Step>
        <Step>Done</Step>
      </Sequence>
    )
    const button = screen.getByRole('button', { name: 'Go' })
    act(() => {
      button.click()
    })
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('respects delay when autoplay is true', async () => {
    render(
      <Sequence autoplay delay={50}>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.queryByText('Second')).toBeNull()
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('fast-forwards to the next step by default', () => {
    render(
      <Sequence>
        <Step>First</Step>
        <Step>Done</Step>
      </Sequence>
    )
    const button = screen.getByRole('button', { name: 'Skip to next step' })
    act(() => {
      button.click()
    })
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('allows customizing skip button text', () => {
    render(
      <Sequence skipLabel='Fast forward'>
        <Step>First</Step>
        <Step>Done</Step>
      </Sequence>
    )
    const button = screen.getByRole('button', { name: 'Skip to next step' })
    expect(button).toHaveTextContent('Fast forward')
    act(() => {
      button.click()
    })
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('fast-forwards to the end when configured', () => {
    render(
      <Sequence fastForward={{ toEnd: true }}>
        <Step>First</Step>
        <Step>Middle</Step>
        <Step>End</Step>
      </Sequence>
    )
    const button = screen.getByRole('button', { name: 'Skip to end' })
    act(() => {
      button.click()
    })
    expect(screen.getByText('End')).toBeInTheDocument()
  })

  it('ignores fast-forward when disabled', () => {
    render(
      <Sequence fastForward={{ enabled: false }}>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    expect(
      screen.queryByRole('button', { name: 'Skip to next step' })
    ).toBeNull()
  })

  it('rewinds to the previous step by default', () => {
    render(
      <Sequence rewind={{ enabled: true }}>
        <Step>
          {({ next }) => (
            <>
              <div>First</div>
              <button type='button' onClick={next}>
                Go
              </button>
            </>
          )}
        </Step>
        <Step>Second</Step>
      </Sequence>
    )
    const next = screen.getByRole('button', { name: 'Go' })
    act(() => {
      next.click()
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
    const rewind = screen.getByRole('button', {
      name: 'Rewind to previous step'
    })
    act(() => {
      rewind.click()
    })
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Rewind to previous step' })
    ).toBeNull()
  })

  it('rewinds to the beginning when configured', () => {
    render(
      <Sequence rewind={{ enabled: true, toStart: true }}>
        <Step>
          {({ next }) => (
            <>
              <div>First</div>
              <button type='button' onClick={next}>
                Go
              </button>
            </>
          )}
        </Step>
        <Step>Middle</Step>
        <Step>End</Step>
      </Sequence>
    )
    const next = screen.getByRole('button', { name: 'Go' })
    act(() => {
      next.click()
    })
    const continueButton = screen.getByRole('button', {
      name: 'Continue to next step'
    })
    act(() => {
      continueButton.click()
    })
    expect(screen.getByText('End')).toBeInTheDocument()
    const rewind = screen.getByRole('button', { name: 'Rewind to start' })
    act(() => {
      rewind.click()
    })
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('renders step content with a fade-in transition', async () => {
    render(
      <Sequence>
        <Step>
          <Transition type='fade-in' duration={200}>
            <div>First</div>
          </Transition>
        </Step>
      </Sequence>
    )
    const wrapper = screen.getByText('First').parentElement as HTMLElement
    expect(wrapper.style.transition).toBe('opacity 200ms ease-in')
    await act(async () => {
      await new Promise(requestAnimationFrame)
    })
    expect(wrapper.style.opacity).toBe('1')
  })

  it('allows nesting sequences within steps', () => {
    render(
      <Sequence>
        <Step>
          <Sequence continueLabel='Inner next' continueAriaLabel='Inner next'>
            <Step>Inner first</Step>
            <Step>Inner second</Step>
          </Sequence>
        </Step>
        <Step>Outer second</Step>
      </Sequence>
    )
    expect(screen.getByText('Inner first')).toBeInTheDocument()
    const innerNext = screen.getByRole('button', { name: 'Inner next' })
    act(() => {
      innerNext.click()
    })
    expect(screen.getByText('Inner second')).toBeInTheDocument()
    const outerNext = screen.getByRole('button', {
      name: 'Continue to next step'
    })
    act(() => {
      outerNext.click()
    })
    expect(screen.getByText('Outer second')).toBeInTheDocument()
  })

  it('allows customizing aria labels', () => {
    render(
      <Sequence continueAriaLabel='Advance' skipAriaLabel='Jump ahead'>
        <Step>First</Step>
        <Step>Second</Step>
      </Sequence>
    )
    const continueButton = screen.getByRole('button', { name: 'Advance' })
    const skipButton = screen.getByRole('button', { name: 'Jump ahead' })
    expect(continueButton).toBeInTheDocument()
    expect(skipButton).toBeInTheDocument()
    act(() => {
      skipButton.click()
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
