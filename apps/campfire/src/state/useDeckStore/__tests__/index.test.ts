import { describe, it, expect, beforeEach } from 'bun:test'
import { useDeckStore } from '../index'

beforeEach(() => {
  useDeckStore.getState().reset()
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
    expect(useDeckStore.getState().currentStep).toBe(1)
    expect(useDeckStore.getState().maxSteps).toBe(1)
  })

  it('jumps to a specific slide and step', () => {
    useDeckStore.getState().setSlidesCount(3)
    useDeckStore.getState().setMaxSteps(2)
    useDeckStore.getState().goTo(2)
    useDeckStore.getState().setMaxSteps(4)
    useDeckStore.getState().goTo(0)
    useDeckStore.getState().goTo(2, 1)
    expect(useDeckStore.getState().currentSlide).toBe(2)
    expect(useDeckStore.getState().currentStep).toBe(1)
    expect(useDeckStore.getState().maxSteps).toBe(4)
  })

  it('clamps slide and step within valid ranges', () => {
    const api = useDeckStore.getState()
    api.setSlidesCount(3)
    api.setMaxSteps(2)
    api.goTo(2)
    api.setMaxSteps(4)
    api.goTo(10, 10)
    expect(useDeckStore.getState().currentSlide).toBe(2)
    expect(useDeckStore.getState().currentStep).toBe(4)
    expect(useDeckStore.getState().maxSteps).toBe(4)
    api.goTo(-1, -1)
    expect(useDeckStore.getState().currentSlide).toBe(0)
    expect(useDeckStore.getState().currentStep).toBe(0)
    expect(useDeckStore.getState().maxSteps).toBe(2)
  })

  it('registers steps for a specific slide', () => {
    const api = useDeckStore.getState()
    api.setSlidesCount(2)
    api.setStepsForSlide(1, 3)
    expect(useDeckStore.getState().stepsPerSlide[1]).toBe(3)
    expect(useDeckStore.getState().maxSteps).toBe(0)
    api.setStepsForSlide(0, 2)
    expect(useDeckStore.getState().maxSteps).toBe(2)
  })
})
