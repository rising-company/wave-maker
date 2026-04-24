import { WaveMaker } from '@rising-company/wave-maker-core'

export function createHero(container: HTMLElement): void {
  container.innerHTML = `
    <section class="hero">
      <canvas id="hero-canvas"></canvas>
      <div class="hero-content">
        <div class="hero-eyebrow">// WebGL Wave Gradients</div>
        <h1 class="hero-title">Wave-Maker</h1>
        <p class="hero-subtitle">Gradient wave effects for the web &mdash; zero dependencies</p>
        <div class="hero-install-section">
          <div class="hero-install-tabs">
            <button class="hero-install-tab hero-install-tab--active" data-pkg="core">Core</button>
            <button class="hero-install-tab" data-pkg="react">React</button>
            <button class="hero-install-tab" data-pkg="vue">Vue</button>
            <button class="hero-install-tab" data-pkg="svelte">Svelte</button>
          </div>
          <div class="hero-install-code">
            <code id="hero-install-cmd">npm i @rising-company/wave-maker-core</code>
            <button class="hero-install-copy" id="hero-copy">Copy</button>
          </div>
        </div>
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
    preset: 'stitch',
  })

  const packages: Record<string, string> = {
    core: 'npm i @rising-company/wave-maker-core',
    react: 'npm i @rising-company/wave-maker-react',
    vue: 'npm i @rising-company/wave-maker-vue',
    svelte: 'npm i @rising-company/wave-maker-svelte',
  }

  const installCmd = document.getElementById('hero-install-cmd')!
  const tabs = container.querySelectorAll('.hero-install-tab')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('hero-install-tab--active'))
      tab.classList.add('hero-install-tab--active')
      installCmd.textContent = packages[(tab as HTMLElement).dataset.pkg!]
    })
  })

  const copyBtn = document.getElementById('hero-copy')!
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(installCmd.textContent ?? '').then(() => {
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy' }, 2000)
    })
  })
}
