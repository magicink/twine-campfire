import { useMemo } from 'react'
import { handleDirective } from './directives/handleDirective'

export const useDirectiveHandlers = () =>
  useMemo(
    () => ({
      set: handleDirective,
      setOnce: handleDirective,
      get: handleDirective,
      random: handleDirective,
      increment: handleDirective,
      decrement: handleDirective,
      unset: handleDirective,
      if: handleDirective
    }),
    []
  )
