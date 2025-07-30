declare global {
  interface Window {
    storyFormat: (input: string) => string
  }
}
