/**
 * Stub Animation class that resolves immediately.
 * Useful for replacing Web Animations in tests.
 */
export class StubAnimation {
  finished: Promise<void>
  private resolve!: () => void

  constructor() {
    this.finished = new Promise<void>(res => {
      this.resolve = res
    })
    setTimeout(() => this.finish(), 0)
  }

  /** Cancels the animation and resolves the finished promise. */
  cancel = () => {
    this.resolve()
  }

  /** Finishes the animation and resolves the finished promise. */
  finish = () => {
    this.resolve()
  }
}
