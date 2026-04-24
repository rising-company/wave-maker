import { WaveMaker } from '@rising-company/wave-maker-core'

export function createShowcases(container: HTMLElement): void {
  container.innerHTML = `
    <section class="section">
      <span class="section-label" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd;">PRESET</span>
      <h2 class="section-title">Stitch Style</h2>
      <p class="section-desc">Valley geometry with dramatic sea-wave crests &mdash; inspired by Google Stitch</p>
      <div class="showcase-canvas-wrapper">
        <canvas id="showcase-stitch"></canvas>
        <div class="showcase-overlay">
          <div>
            <h3>Your Title Here</h3>
            <p>Content sits in the valley</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <span class="section-label" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd;">PRESET</span>
      <h2 class="section-title">Alex Harri Style</h2>
      <p class="section-desc">Flowing horizontal waves with gradient color mapping and soft blur edges</p>
      <div class="showcase-canvas-wrapper">
        <canvas id="showcase-ocean"></canvas>
      </div>
    </section>
  `

  const stitchCanvas = document.getElementById('showcase-stitch') as HTMLCanvasElement
  new WaveMaker(stitchCanvas, {
    preset: 'stitch',
  })

  const oceanCanvas = document.getElementById('showcase-ocean') as HTMLCanvasElement
  new WaveMaker(oceanCanvas, {
    preset: 'ocean',
    valley: false,
    waveCount: 2,
    speed: 1.0,
  })
}
