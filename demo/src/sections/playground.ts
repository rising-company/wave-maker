import { WaveMaker, presetNames } from '@rising-company/wave-maker'
import type { PresetName } from '@rising-company/wave-maker'

interface PlaygroundState {
  preset: PresetName
  speed: number
  amplitude: number
  blur: number
  waveCount: 1 | 2 | 3
  valley: boolean
  valleyDepth: number
  noiseDetail: number
}

const DEFAULTS: PlaygroundState = {
  preset: 'ocean',
  speed: 1.0,
  amplitude: 1.0,
  blur: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  noiseDetail: 4,
}

type Framework = 'react' | 'vue' | 'svelte' | 'vanilla'

function generateCode(framework: Framework, state: PlaygroundState): string {
  // Collect non-default options
  const opts: Record<string, unknown> = {}
  if (state.preset !== DEFAULTS.preset) opts.preset = state.preset
  if (state.speed !== DEFAULTS.speed) opts.speed = state.speed
  if (state.amplitude !== DEFAULTS.amplitude) opts.amplitude = state.amplitude
  if (state.blur !== DEFAULTS.blur) opts.blur = state.blur
  if (state.waveCount !== DEFAULTS.waveCount) opts.waveCount = state.waveCount
  if (state.valley !== DEFAULTS.valley) opts.valley = state.valley
  if (state.valley && state.valleyDepth !== DEFAULTS.valleyDepth) opts.valleyDepth = state.valleyDepth
  if (state.noiseDetail !== DEFAULTS.noiseDetail) opts.noiseDetail = state.noiseDetail

  const hasOpts = Object.keys(opts).length > 0

  if (framework === 'vanilla') {
    const optsStr = hasOpts ? `, ${formatJSObject(opts)}` : ''
    return `import { WaveMaker } from '@rising-company/wave-maker'

const canvas = document.getElementById('my-canvas')
const wm = new WaveMaker(canvas${optsStr})`
  }

  if (framework === 'react') {
    const propsStr = hasOpts ? formatJSXProps(opts) : ''
    return `import { WaveGradient } from '@rising-company/wave-maker-react'

export default function App() {
  return (
    <WaveGradient
      style={{ width: '100%', height: 400 }}${propsStr}
    />
  )
}`
  }

  if (framework === 'vue') {
    const propsStr = hasOpts ? formatVueProps(opts) : ''
    return `<template>
  <WaveGradient
    style="width: 100%; height: 400px"${propsStr}
  />
</template>

<script setup>
import { WaveGradient } from '@rising-company/wave-maker-vue'
</script>`
  }

  // svelte
  const propsStr = hasOpts ? formatSvelteProps(opts) : ''
  return `<script>
  import { WaveGradient } from '@rising-company/wave-maker-svelte'
</script>

<WaveGradient
  style="width: 100%; height: 400px"${propsStr}
/>`
}

function formatJSObject(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).map(([k, v]) => {
    if (typeof v === 'string') return `${k}: '${v}'`
    return `${k}: ${v}`
  })
  return `{ ${entries.join(', ')} }`
}

function formatJSXProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n      ${k}="${v}"`
      if (typeof v === 'boolean') return v ? `\n      ${k}` : `\n      ${k}={false}`
      return `\n      ${k}={${v}}`
    })
    .join('')
}

function formatVueProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n    ${k}="${v}"`
      return `\n    :${k}="${v}"`
    })
    .join('')
}

function formatSvelteProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n  ${k}="${v}"`
      if (typeof v === 'boolean') return v ? `\n  ${k}={true}` : `\n  ${k}={false}`
      return `\n  ${k}={${v}}`
    })
    .join('')
}

// Controls that require full recreation (vs. dynamic setters)
const RECREATE_KEYS: (keyof PlaygroundState)[] = ['preset', 'blur', 'waveCount', 'valley', 'valleyDepth', 'noiseDetail']

export function createPlayground(container: HTMLElement): void {
  const state: PlaygroundState = { ...DEFAULTS }
  let wm: WaveMaker | null = null
  let activeFramework: Framework = 'vanilla'

  container.innerHTML = `
    <section class="section">
      <span class="section-label" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7;">INTERACTIVE</span>
      <h2 class="section-title">Playground</h2>
      <p class="section-desc">Tweak every parameter and copy the code for your framework</p>

      <div class="pg-layout">
        <div class="pg-preview">
          <div class="showcase-canvas-wrapper" style="height: 500px;">
            <canvas id="pg-canvas"></canvas>
          </div>
        </div>

        <div class="pg-controls">
          <!-- Preset -->
          <div class="pg-group">
            <label class="pg-label">Preset</label>
            <div class="pg-btn-group" id="pg-presets"></div>
          </div>

          <!-- Speed -->
          <div class="pg-group">
            <label class="pg-label">Speed <span id="pg-speed-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-speed" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <!-- Amplitude -->
          <div class="pg-group">
            <label class="pg-label">Amplitude <span id="pg-amp-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-amp" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <!-- Blur -->
          <div class="pg-group">
            <label class="pg-label">Blur <span id="pg-blur-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-blur" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <!-- Noise Detail -->
          <div class="pg-group">
            <label class="pg-label">Noise Detail <span id="pg-noise-val">4</span></label>
            <input type="range" class="pg-slider" id="pg-noise" min="1" max="6" step="1" value="4" />
          </div>

          <!-- Wave Count -->
          <div class="pg-group">
            <label class="pg-label">Wave Count</label>
            <div class="pg-btn-group" id="pg-wave-count">
              <button class="pg-btn" data-val="1">1</button>
              <button class="pg-btn pg-btn--active" data-val="2">2</button>
              <button class="pg-btn" data-val="3">3</button>
            </div>
          </div>

          <!-- Valley -->
          <div class="pg-group">
            <label class="pg-label">Valley</label>
            <div class="pg-btn-group" id="pg-valley">
              <button class="pg-btn" data-val="on">On</button>
              <button class="pg-btn pg-btn--active" data-val="off">Off</button>
            </div>
          </div>

          <!-- Valley Depth (conditionally visible) -->
          <div class="pg-group" id="pg-valley-depth-group" style="display: none;">
            <label class="pg-label">Valley Depth <span id="pg-vd-val">0.32</span></label>
            <input type="range" class="pg-slider" id="pg-vd" min="0" max="1" step="0.01" value="0.32" />
          </div>
        </div>
      </div>

      <!-- Code Output -->
      <div class="pg-code-section">
        <div class="pg-tabs" id="pg-tabs">
          <button class="pg-tab" data-fw="react">React</button>
          <button class="pg-tab" data-fw="vue">Vue</button>
          <button class="pg-tab" data-fw="svelte">Svelte</button>
          <button class="pg-tab pg-tab--active" data-fw="vanilla">Vanilla</button>
        </div>
        <div class="pg-code-wrapper">
          <pre class="pg-code"><code id="pg-code-output"></code></pre>
          <button class="pg-copy-btn" id="pg-copy">Copy</button>
        </div>
      </div>
    </section>
  `

  const canvas = document.getElementById('pg-canvas') as HTMLCanvasElement

  // --- Helpers ---
  function recreate(): void {
    if (wm) {
      wm.destroy()
      wm = null
    }
    wm = new WaveMaker(canvas, { ...state })
  }

  function updateCode(): void {
    const el = document.getElementById('pg-code-output')!
    el.textContent = generateCode(activeFramework, state)
  }

  // --- Init preset buttons ---
  const presetGroup = document.getElementById('pg-presets')!
  for (const name of presetNames) {
    const btn = document.createElement('button')
    btn.className = 'pg-btn' + (name === state.preset ? ' pg-btn--active' : '')
    btn.textContent = name
    btn.dataset.val = name
    presetGroup.appendChild(btn)
  }

  // --- Preset selection ---
  presetGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.pg-btn') as HTMLButtonElement | null
    if (!btn) return
    const name = btn.dataset.val as PresetName
    state.preset = name
    presetGroup.querySelectorAll('.pg-btn').forEach((b) => b.classList.remove('pg-btn--active'))
    btn.classList.add('pg-btn--active')
    recreate()
    updateCode()
  })

  // --- Speed slider ---
  const speedSlider = document.getElementById('pg-speed') as HTMLInputElement
  const speedVal = document.getElementById('pg-speed-val')!
  speedSlider.addEventListener('input', () => {
    const v = parseFloat(speedSlider.value)
    state.speed = v
    speedVal.textContent = v.toFixed(1)
    if (wm) wm.setSpeed(v)
    updateCode()
  })

  // --- Amplitude slider ---
  const ampSlider = document.getElementById('pg-amp') as HTMLInputElement
  const ampVal = document.getElementById('pg-amp-val')!
  ampSlider.addEventListener('input', () => {
    const v = parseFloat(ampSlider.value)
    state.amplitude = v
    ampVal.textContent = v.toFixed(1)
    if (wm) wm.setAmplitude(v)
    updateCode()
  })

  // --- Blur slider ---
  const blurSlider = document.getElementById('pg-blur') as HTMLInputElement
  const blurVal = document.getElementById('pg-blur-val')!
  blurSlider.addEventListener('input', () => {
    const v = parseFloat(blurSlider.value)
    state.blur = v
    blurVal.textContent = v.toFixed(1)
    recreate()
    updateCode()
  })

  // --- Noise detail slider ---
  const noiseSlider = document.getElementById('pg-noise') as HTMLInputElement
  const noiseVal = document.getElementById('pg-noise-val')!
  noiseSlider.addEventListener('input', () => {
    const v = parseInt(noiseSlider.value, 10)
    state.noiseDetail = v
    noiseVal.textContent = String(v)
    recreate()
    updateCode()
  })

  // --- Wave count ---
  const waveCountGroup = document.getElementById('pg-wave-count')!
  waveCountGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.pg-btn') as HTMLButtonElement | null
    if (!btn) return
    const v = parseInt(btn.dataset.val!, 10) as 1 | 2 | 3
    state.waveCount = v
    waveCountGroup.querySelectorAll('.pg-btn').forEach((b) => b.classList.remove('pg-btn--active'))
    btn.classList.add('pg-btn--active')
    recreate()
    updateCode()
  })

  // --- Valley toggle ---
  const valleyGroup = document.getElementById('pg-valley')!
  const valleyDepthGroup = document.getElementById('pg-valley-depth-group')!
  valleyGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.pg-btn') as HTMLButtonElement | null
    if (!btn) return
    const isOn = btn.dataset.val === 'on'
    state.valley = isOn
    valleyGroup.querySelectorAll('.pg-btn').forEach((b) => b.classList.remove('pg-btn--active'))
    btn.classList.add('pg-btn--active')
    valleyDepthGroup.style.display = isOn ? '' : 'none'
    recreate()
    updateCode()
  })

  // --- Valley depth slider ---
  const vdSlider = document.getElementById('pg-vd') as HTMLInputElement
  const vdVal = document.getElementById('pg-vd-val')!
  vdSlider.addEventListener('input', () => {
    const v = parseFloat(vdSlider.value)
    state.valleyDepth = v
    vdVal.textContent = v.toFixed(2)
    recreate()
    updateCode()
  })

  // --- Framework tabs ---
  const tabsContainer = document.getElementById('pg-tabs')!
  tabsContainer.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest('.pg-tab') as HTMLButtonElement | null
    if (!tab) return
    activeFramework = tab.dataset.fw as Framework
    tabsContainer.querySelectorAll('.pg-tab').forEach((t) => t.classList.remove('pg-tab--active'))
    tab.classList.add('pg-tab--active')
    updateCode()
  })

  // --- Copy button ---
  const copyBtn = document.getElementById('pg-copy')!
  copyBtn.addEventListener('click', () => {
    const code = document.getElementById('pg-code-output')!.textContent ?? ''
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = 'Copied!'
      setTimeout(() => {
        copyBtn.textContent = 'Copy'
      }, 2000)
    })
  })

  // --- Init ---
  recreate()
  updateCode()
}
