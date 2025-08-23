import type { Properties } from 'hast'
import type { Data } from 'unist'

/**
 * Metadata for nodes transformed into custom HAST elements.
 */
export interface HastData extends Data {
  /** Tag name applied by rehype */
  hName?: string
  /** HAST properties for the generated element */
  hProperties?: Properties
}
