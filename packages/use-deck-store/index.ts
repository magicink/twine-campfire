import { produce } from 'immer'
import { create } from 'zustand'

export interface DeckState {
  /** Currently active slide index */
  currentSlide: number
  /** Currently active step within the slide */
  currentStep: number
  /** Maximum number of steps for the current slide */
  maxSteps: number
  /** Total number of slides */
  slidesCount: number
  /** Update the total slide count */
  setSlidesCount: (n: number) => void
  /** Update the maximum steps for the current slide */
  setMaxSteps: (n: number) => void
  /** Advance to the next step or slide */
  next: () => void
  /** Go back to the previous step or slide */
  prev: () => void
  /** Jump to a specific slide and step */
  goTo: (slide: number, step?: number) => void
}

export const useDeckStore = create<DeckState>((set, get) => ({
  currentSlide: 0,
  currentStep: 0,
  maxSteps: 0,
  slidesCount: 0,
  setSlidesCount: n =>
    set(
      produce((state: DeckState) => {
        state.slidesCount = n
      })
    ),
  setMaxSteps: n =>
    set(
      produce((state: DeckState) => {
        state.maxSteps = n
      })
    ),
  next: () => {
    const { currentStep, maxSteps, currentSlide, slidesCount } = get()
    if (currentStep < maxSteps) {
      set(
        produce((state: DeckState) => {
          state.currentStep += 1
        })
      )
    } else if (currentSlide < slidesCount - 1) {
      set(
        produce((state: DeckState) => {
          state.currentSlide += 1
          state.currentStep = 0
          state.maxSteps = 0
        })
      )
    }
  },
  prev: () => {
    const { currentStep, currentSlide } = get()
    if (currentStep > 0) {
      set(
        produce((state: DeckState) => {
          state.currentStep -= 1
        })
      )
    } else if (currentSlide > 0) {
      set(
        produce((state: DeckState) => {
          state.currentSlide -= 1
          state.currentStep = 0
          state.maxSteps = 0
        })
      )
    }
  },
  goTo: (slide, step = 0) =>
    set(
      produce((state: DeckState) => {
        state.currentSlide = slide
        state.currentStep = step
        state.maxSteps = 0
      })
    )
}))
