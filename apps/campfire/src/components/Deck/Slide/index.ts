import { Slide } from './Slide'

export type {
  TransitionType,
  Direction,
  Transition,
  SlideTransition,
  SlideProps
} from '../../../../../../types'
export { Slide }
export { SlideReveal } from './SlideReveal'
export { SlideText, SlideImage, SlideShape } from './SlideElements'
export { createSlideElement } from './createSlideElement'
export { Layer } from './Layer'
export type { LayerProps } from './Layer'
export { SlideLayer } from './SlideLayer'
export type { SlideLayerProps } from './SlideLayer'
export { renderDirectiveMarkdown } from './renderDirectiveMarkdown'

export default Slide
