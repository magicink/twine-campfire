import { describe, it, expect, beforeEach } from 'bun:test'
import { useDeckStore } from '../index'

beforeEach(() => {
  useDeckStore.setState({
    currentSlide: 0,
    currentStep: 0,
    maxSteps: 0,
    slidesCount: 0
  })
})

describe('useDeckStore', () => {
  it('updates slide and step counts', () => {
    useDeckStore.getState().setSlidesCount(5)
    useDeckStore.getState().setMaxSteps(2)
    expect(useDeckStore.getState().slidesCount).toBe(5)
    expect(useDeckStore.getState().maxSteps).toBe(2)
  })

  it('advances through steps and slides', () => {
    useDeckStore.getState().setSlidesCount(2)
    useDeckStore.getState().setMaxSteps(1)
    useDeckStore.getState().next()
    expect(useDeckStore.getState().currentStep).toBe(1)
    useDeckStore.getState().next()
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(useDeckStore.getState().currentStep).toBe(0)
    expect(useDeckStore.getState().maxSteps).toBe(0)
  })

  it('moves back through steps and slides', () => {
    useDeckStore.getState().setSlidesCount(2)
    useDeckStore.getState().setMaxSteps(1)
    useDeckStore.getState().next()
    useDeckStore.getState().next()
    useDeckStore.getState().prev()
    expect(useDeckStore.getState().currentSlide).toBe(0)
    expect(useDeckStore.getState().currentStep).toBe(0)
  })

  it('jumps to a specific slide and step', () => {
    useDeckStore.getState().setSlidesCount(3)
    useDeckStore.getState().goTo(2, 1)
    expect(useDeckStore.getState().currentSlide).toBe(2)
    expect(useDeckStore.getState().currentStep).toBe(1)
    expect(useDeckStore.getState().maxSteps).toBe(0)
  })
})
