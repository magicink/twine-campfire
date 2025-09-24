import { h } from 'preact'
import type { ComponentChildren, JSX } from 'preact'

/**
 * Shared props for Twine custom elements rendered via Preact.
 */
type TwineElementProps = JSX.HTMLAttributes<HTMLElement> & {
  children?: ComponentChildren
}

/**
 * Renders a `<tw-storydata>` element using Preact's `h` helper to ensure the
 * custom element is created correctly when Storybook compiles the story.
 *
 * @param props - Attributes and children passed to the `tw-storydata` element.
 * @returns The rendered Twine story data element.
 */
export const TwStorydata = ({ children, ...props }: TwineElementProps) =>
  h('tw-storydata', props, children)

/**
 * Renders a `<tw-passagedata>` element via Preact's `h` helper so that Twine
 * story passages are consistently emitted in Storybook builds.
 *
 * @param props - Attributes and children passed to the `tw-passagedata`.
 * @returns The rendered Twine passage data element.
 */
export const TwPassagedata = ({ children, ...props }: TwineElementProps) =>
  h('tw-passagedata', props, children)
