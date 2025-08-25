import { AudioManager } from './AudioManager'

/**
 * Hook returning the singleton AudioManager instance.
 *
 * @returns AudioManager instance.
 */
export const useAudioManager = () => AudioManager.getInstance()
