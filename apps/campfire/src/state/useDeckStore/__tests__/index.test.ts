import { describe, it, expect, beforeEach } from 'bun:test'
import { useDeckStore } from '../index'

beforeEach(() => {
  useDeckStore.getState().reset()
})

describe('useDeckStore', () => {
  it('resets state to its initial values', () => {
    const api = useDeckStore.getState()
    api.setSlidesCount(5)
    api.setStepsForSlide(0, 2)
    api.goTo(0, 1)
    api.reset()
    const state = useDeckStore.getState()
    expect(state.currentSlide).toBe(0)
    expect(state.currentStep).toBe(0)
    expect(state.maxSteps).toBe(0)
    expect(state.slidesCount).toBe(0)
    expect(state.stepsPerSlide).toEqual({})
  })

  it('clamps slide and step within valid ranges', () => {
    const api = useDeckStore.getState()
    api.setSlidesCount(3)
    api.setStepsForSlide(2, 4)
    api.goTo(10, 10)
    expect(useDeckStore.getState().currentSlide).toBe(2)
    expect(useDeckStore.getState().currentStep).toBe(4)
    expect(useDeckStore.getState().maxSteps).toBe(4)
    api.goTo(-1, -1)
    expect(useDeckStore.getState().currentSlide).toBe(0)
    expect(useDeckStore.getState().currentStep).toBe(0)
    expect(useDeckStore.getState().maxSteps).toBe(0)
  })

  it('clamps current step when reducing steps for the current slide', () => {
    const api = useDeckStore.getState()
    api.setSlidesCount(1)
    api.setStepsForSlide(0, 5)
    api.goTo(0, 5)
    api.setStepsForSlide(0, 2)
    expect(useDeckStore.getState().currentStep).toBe(2)
    expect(useDeckStore.getState().maxSteps).toBe(2)
  })
})
