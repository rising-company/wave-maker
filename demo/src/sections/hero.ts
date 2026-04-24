import { WaveMaker } from '@rising-company/wave-maker-core'

export function createHero(container: HTMLElement): void {
  container.innerHTML = `
    <section class="hero">
      <canvas id="hero-canvas"></canvas>
      <div class="hero-content">
        <div class="hero-eyebrow">// WebGL Wave Gradients</div>
        <h1 class="hero-title">Wave-Maker</h1>
        <p class="hero-subtitle">Gradient wave effects for the web &mdash; zero dependencies</p>
        <code class="hero-install">npm i @rising-company/wave-maker-core</code>
      </div>
      <div class="hero-stats">
        <div class="stat-row">
          <div class="stat-label">Renderer</div>
          <div class="stat-value">WEBGL 2.0</div>
        </div>
        <div class="stat-row">
          <div class="stat-label">Dependencies</div>
          <div class="stat-value">ZERO</div>
        </div>
        <div class="stat-row">
          <div class="stat-label">Frameworks</div>
          <div class="stat-value">REACT &middot; VUE &middot; SVELTE</div>
        </div>
      </div>
      <div class="hero-controls-hint">
        <p><span>SCROLL</span> &mdash; Explore</p>
      </div>
    </section>
  `
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement
  new WaveMaker(canvas, {
    preset: 'aurora',
    valley: true,
    valleyDepth: 0.35,
    amplitude: 1.0,
    speed: 0.6,
  })
}
