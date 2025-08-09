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
    const button = screen.getByRole('button', { name: 'Continue' })
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
    const button = screen.getByRole('button', { name: 'Next step' })
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
    const button = screen.getByRole('button', { name: 'Skip' })
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
    const button = screen.getByRole('button', { name: 'Fast forward' })
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
    const button = screen.getByRole('button', { name: 'Skip' })
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
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
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
})
