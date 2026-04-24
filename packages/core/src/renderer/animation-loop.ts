/**
 * Manages a requestAnimationFrame loop with FPS throttling.
 */
export class AnimationLoop {
  private _onFrame: (time: number) => void
  private _fps: number
  private _interval: number
  private _rafId: number | null = null
  private _lastFrameTime = 0
  private _startTime = 0
  private _playing = false

  /**
   * @param onFrame Callback invoked each frame with elapsed time in seconds
   * @param fps Target frame rate cap
   */
  constructor(onFrame: (time: number) => void, fps: number) {
    this._onFrame = onFrame
    this._fps = fps
    this._interval = 1000 / fps
  }

  /** Whether the animation loop is currently running */
  get isPlaying(): boolean {
    return this._playing
  }

  /** Update the target frame rate */
  setFps(fps: number): void {
    this._fps = fps
    this._interval = 1000 / fps
  }

  /** Start or resume the animation loop */
  play(): void {
    if (this._playing) return
    this._playing = true
    this._lastFrameTime = performance.now()
    if (this._startTime === 0) {
      this._startTime = this._lastFrameTime
    }
    this._tick()
  }

  /** Pause the animation loop (can be resumed with play) */
  pause(): void {
    this._playing = false
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  /** Stop the animation loop and reset elapsed time */
  stop(): void {
    this.pause()
    this._startTime = 0
  }

  private _tick = (): void => {
    if (!this._playing) return
    this._rafId = requestAnimationFrame(this._loop)
  }

  private _loop = (now: number): void => {
    if (!this._playing) return

    const elapsed = now - this._lastFrameTime
    if (elapsed >= this._interval) {
      this._lastFrameTime = now - (elapsed % this._interval)
      const timeInSeconds = (now - this._startTime) / 1000
      this._onFrame(timeInSeconds)
    }

    this._tick()
  }
}
