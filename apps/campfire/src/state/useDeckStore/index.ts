import { create } from 'zustand'
import { setImmer } from '@campfire/state/utils'

export interface DeckState {
  /** Currently active slide index */
  currentSlide: number
  /** Currently active step within the slide */
  currentStep: number
  /** Maximum number of steps for the current slide */
  maxSteps: number
  /** Total number of slides */
  slidesCount: number
  /** Internal mapping of slide index to its max steps */
  stepsPerSlide: Record<number, number>
  /** Update the total slide count */
  setSlidesCount: (n: number) => void
  /** Update the maximum steps for the current slide */
  setMaxSteps: (n: number) => void
  /** Register the max steps for a specific slide */
  setStepsForSlide: (slide: number, steps: number) => void
  /** Advance to the next step or slide */
  next: () => void
  /** Go back to the previous step or slide */
  prev: () => void
  /** Jump to a specific slide and step */
  goTo: (slide: number, step?: number) => void
  /** Reset the deck to its initial state */
  reset: () => void
}

/** Initial state for the deck store */
const initialState = {
  currentSlide: 0,
  currentStep: 0,
  maxSteps: 0,
  slidesCount: 0,
  stepsPerSlide: {} as Record<number, number>
}

/** Zustand store for tracking slide and step navigation */
export const useDeckStore = create<DeckState>((set, get) => {
  const immer = setImmer<DeckState>(set)
  return {
    ...initialState,
    /** Update the total slide count */
    setSlidesCount: n =>
      immer(state => {
        state.slidesCount = n
      }),
    /** Update the maximum steps for the current slide */
    setMaxSteps: n =>
      immer(state => {
        state.maxSteps = n
        state.stepsPerSlide[state.currentSlide] = n
      }),
    /** Register the max steps for a slide index */
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
    /** Advance to the next step or slide */
    next: () => {
      const {
        currentStep,
        maxSteps,
        currentSlide,
        slidesCount,
        stepsPerSlide
      } = get()
      const nextSlide = currentSlide + 1
      // Move to the next slide only if it exists
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
    /** Go back to the previous step or slide */
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
    /** Jump to a specific slide and step */
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
    /** Reset the deck to its initial state */
    reset: () => set(initialState)
  }
})
