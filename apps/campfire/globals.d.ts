import type { ComponentChild } from 'preact'

declare global {
  interface Window {
    storyFormat: (input: string) => string
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number
    cancelIdleCallback?: (handle: number) => void
  }

  let __campfirePassageCache:
    | Map<string, { text: string; content: ComponentChild }>
    | undefined
}

export {}
