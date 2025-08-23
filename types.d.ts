import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import { Matchers, AsymmetricMatchers } from 'bun:test'

/** Testing Library matcher extensions for Bun's test interface. */
declare module 'bun:test' {
  interface Matchers<T>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}

/**
 * Ambient declarations to allow TwineJS custom elements in TSX/JSX
 * with Preact's JSX namespace. This augments JSX.IntrinsicElements so
 * TypeScript recognizes these tags without complaining.
 */
declare global {
  namespace JSX {
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

  /** DOM-level augmentations so TS knows these custom tags in createElement/querySelector. */
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
   * Augment Preact's JSX namespace for the automatic runtime without touching module exports.
   * Preact defines types under `preact.JSX` or `JSXInternal` mapped to it; augmenting `preact.JSX` is safe.
   */
  namespace preact.JSX {
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

  /** Global window augmentations. */
  interface Window {
    storyFormat: (input: string) => string
  }
}

export {}
