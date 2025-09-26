import { h } from 'preact'
import type { ComponentChildren, JSX } from 'preact'

/**
 * Shared props for Twine custom elements rendered via Preact.
 */
type TwineElementProps = JSX.HTMLAttributes<HTMLElement> & {
  children?: ComponentChildren
}

/**
 * Props accepted by the {@link TwStorydata} helper for the `tw-storydata`
 * element.
 */
type TwStorydataProps = TwineElementProps & {
  /**
   * Identifier for the passage that should render first when the story loads.
   */
  startnode?: string
  /**
   * Human-readable title for the story displayed in the Twine UI.
   */
  name?: string
  /**
   * Space-separated list of story options (for example `debug`).
   */
  options?: string
}

/**
 * Props accepted by the {@link TwPassagedata} helper for the
 * `tw-passagedata` element.
 */
type TwPassagedataProps = TwineElementProps & {
  /**
   * Unique passage identifier referenced by other passages and directives.
   */
  pid?: string
  /**
   * Human-readable passage title used by links and debugging tools.
   */
  name?: string
}

/**
 * Renders a `<tw-storydata>` element using Preact's `h` helper to ensure the
 * custom element is created correctly when Storybook compiles the story.
 *
 * @param props - Attributes and children passed to the `tw-storydata` element.
 * @returns The rendered Twine story data element.
 */
export const TwStorydata = ({ children, ...props }: TwStorydataProps) =>
  h('tw-storydata', props, children)

/**
 * Renders a `<tw-passagedata>` element via Preact's `h` helper so that Twine
 * story passages are consistently emitted in Storybook builds.
 *
 * @param props - Attributes and children passed to the `tw-passagedata`.
 * @returns The rendered Twine passage data element.
 */
export const TwPassagedata = ({ children, ...props }: TwPassagedataProps) =>
  h('tw-passagedata', props, children)
