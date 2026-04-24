import { WaveMaker } from '@rising-company/wave-maker-core'

export function createShowcases(container: HTMLElement): void {
  container.innerHTML = `
    <hr class="section-divider" />
    <section class="section">
      <div class="section-eyebrow">// Preset &middot; Valley Mode</div>
      <h2 class="section-title">Stitch Style</h2>
      <p class="section-desc">Valley geometry with dramatic wave crests &mdash; inspired by Google Stitch</p>
      <div class="showcase-canvas-wrapper">
        <canvas id="showcase-stitch"></canvas>
        <div class="showcase-overlay">
          <div>
            <h3>Your Title Here</h3>
            <p>// content sits in the valley</p>
          </div>
        </div>
      </div>
    </section>

    <hr class="section-divider" />
    <section class="section">
      <div class="section-eyebrow">// Preset &middot; Horizontal Flow</div>
      <h2 class="section-title">Alex Harri Style</h2>
      <p class="section-desc">Flowing horizontal waves with gradient color mapping &mdash; soft blur edges</p>
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
