/**
 * Augments JSX namespaces so Twine custom elements type-check in Preact.
 */
declare namespace JSX {
  type TwineElementProps<T extends HTMLElement = HTMLElement> =
    JSX.HTMLAttributes<T> & {
      name?: string
      tags?: string
      type?: string
      [attr: `data-${string}`]: string | number | boolean | undefined
      [attr: string]: unknown
    }

  interface IntrinsicElements {
    'tw-story': TwineElementProps
    'tw-passage': TwineElementProps
    'tw-sidebar': TwineElementProps
    'tw-link': TwineElementProps
    'tw-hook': TwineElementProps
    'tw-enchantment': TwineElementProps
    'tw-storydata': TwineElementProps
    'tw-passagedata': TwineElementProps
  }
}

/**
 * Enables DOM APIs to resolve Twine element names.
 */
interface HTMLElementTagNameMap {
  'tw-story': HTMLElement
  'tw-passage': HTMLElement
  'tw-sidebar': HTMLElement
  'tw-link': HTMLElement
  'tw-hook': HTMLElement
  'tw-enchantment': HTMLElement
  'tw-storydata': HTMLElement
  'tw-passagedata': HTMLElement
}

interface ElementTagNameMap {
  'tw-story': HTMLElement
  'tw-passage': HTMLElement
  'tw-sidebar': HTMLElement
  'tw-link': HTMLElement
  'tw-hook': HTMLElement
  'tw-enchantment': HTMLElement
  'tw-storydata': HTMLElement
  'tw-passagedata': HTMLElement
}

/**
 * Mirrors the augmentation for the automatic JSX runtime.
 */
declare namespace preact.JSX {
  type TwineElementProps<T extends HTMLElement = HTMLElement> =
    preact.JSX.HTMLAttributes<T> & {
      name?: string
      tags?: string
      type?: string
      [attr: `data-${string}`]: string | number | boolean | undefined
      [attr: string]: unknown
    }

  interface IntrinsicElements {
    'tw-story': TwineElementProps
    'tw-passage': TwineElementProps
    'tw-sidebar': TwineElementProps
    'tw-link': TwineElementProps
    'tw-hook': TwineElementProps
    'tw-enchantment': TwineElementProps
    'tw-storydata': TwineElementProps
    'tw-passagedata': TwineElementProps
  }
}
