import { normalizeDirectiveIndentation } from '@campfire/utils/normalizeDirectiveIndentation'

export type WorkerRequest = { id: number; text: string }
export type WorkerResponse = { id: number; result: string }

/**
 * Responds to messages from the main thread with normalized passage text.
 *
 * @param event - Message containing raw passage text.
 */
self.onmessage = event => {
  const { id, text } = event.data as WorkerRequest
  const result = normalizeDirectiveIndentation(text)
  self.postMessage({ id, result } as WorkerResponse)
}

export {}
