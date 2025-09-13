import type { ComponentChild } from 'preact'

interface WorkerState {
  worker: Worker | null
  pending: Map<number, (r: string) => void>
  nextId: number
  unloadHandler?: () => void
}

declare global {
  interface Window {
    storyFormat: (input: string) => string
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number
    cancelIdleCallback?: (handle: number) => void
  }

  // eslint-disable-next-line no-var
  var __campfirePassageWorker: WorkerState | undefined
  // eslint-disable-next-line no-var
  var __campfirePassageCache:
    | Map<string, { text: string; content: ComponentChild }>
    | undefined
}

export {}
