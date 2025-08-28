import { create } from 'zustand'
import { setImmer } from '@campfire/state/utils'
import type { DeckState } from '@campfire/state/useDeckStore'

/** Initial state for the overlay deck store */
const initialState = {
  currentSlide: 0,
  currentStep: 0,
  maxSteps: 0,
  slidesCount: 0,
  stepsPerSlide: {} as Record<number, number>
}

/**
 * Zustand store for overlay decks to keep their navigation state persistent
 * across passage changes.
 */
export const useOverlayDeckStore = create<DeckState>((set, get) => {
  const immer = setImmer<DeckState>(set)
  return {
    ...initialState,
    setSlidesCount: n =>
      immer(state => {
        state.slidesCount = n
      }),
    setMaxSteps: n =>
      immer(state => {
        state.maxSteps = n
        state.stepsPerSlide[state.currentSlide] = n
      }),
    setStepsForSlide: (slide, steps) =>
      immer(state => {
        state.stepsPerSlide[slide] = steps
        if (state.currentSlide === slide) {
          state.maxSteps = steps
          if (state.currentStep > steps) {
            state.currentStep = steps
          }
        }
      }),
    next: () => {
      const {
        currentStep,
        maxSteps,
        currentSlide,
        slidesCount,
        stepsPerSlide
      } = get()
      const nextSlide = currentSlide + 1
      if (currentStep < maxSteps) {
        immer(state => {
          state.currentStep += 1
        })
      } else if (nextSlide < slidesCount) {
        const nextMaxSteps = stepsPerSlide[nextSlide] ?? 0
        immer(state => {
          state.currentSlide = nextSlide
          state.currentStep = 0
          state.maxSteps = nextMaxSteps
        })
      }
    },
    prev: () => {
      const { currentStep, currentSlide, stepsPerSlide } = get()
      if (currentStep > 0) {
        immer(state => {
          state.currentStep -= 1
        })
      } else if (currentSlide > 0) {
        const previousSlide = currentSlide - 1
        const previousMaxSteps = stepsPerSlide[previousSlide] ?? 0
        immer(state => {
          state.currentSlide = previousSlide
          state.maxSteps = previousMaxSteps
          state.currentStep = previousMaxSteps
        })
      }
    },
    goTo: (slide, step = 0) =>
      immer(state => {
        const { slidesCount, stepsPerSlide } = state
        const maxSlideIndex = Math.max(slidesCount - 1, 0)
        const targetSlide = Math.min(Math.max(slide, 0), maxSlideIndex)
        const maxStepsForSlide = stepsPerSlide[targetSlide] ?? 0
        const targetStep = Math.min(Math.max(step, 0), maxStepsForSlide)
        state.currentSlide = targetSlide
        state.currentStep = targetStep
        state.maxSteps = maxStepsForSlide
      }),
    reset: () => set({ ...initialState })
  }
})

export default useOverlayDeckStore
