export const buttonBaseClasses = `
  inline-flex items-center justify-center gap-2 whitespace-nowrap
  rounded-md text-sm font-medium
  transition-all
  disabled:pointer-events-none disabled:opacity-50
  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0
  outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
  bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-gray-900)]
  text-[var(--color-gray-50)] shadow-xs
  hover:from-[var(--color-primary-500)] hover:to-[var(--color-gray-800)]
  [text-shadow:0_2px_4px_rgba(0,0,0,0.65)]
  h-9 px-4 py-2 has-[>svg]:px-3
`.trim()
