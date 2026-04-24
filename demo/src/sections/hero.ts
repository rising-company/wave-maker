import { WaveMaker } from '@rising-company/wave-maker'

export function createHero(container: HTMLElement): void {
  container.innerHTML = `
    <section class="hero">
      <canvas id="hero-canvas"></canvas>
      <div class="hero-content">
        <h1 class="hero-title">wave-maker</h1>
        <p class="hero-subtitle">Beautiful WebGL wave gradients for the web</p>
        <code class="hero-install">npm i @rising-company/wave-maker</code>
      </div>
    </section>
  `
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement
  new WaveMaker(canvas, { preset: 'stitch' })
}
