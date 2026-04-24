import { WaveMaker, presetNames, getPreset } from '@rising-company/wave-maker-core'
import type { PresetName } from '@rising-company/wave-maker-core'

// --- Random palette generation ---

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function generateRandomPalette(): string[] {
  // Pick a random base hue, then build a harmonious 5-color gradient
  // from dark to light with hue variation
  const baseHue = Math.random() * 360
  const count = 4 + Math.floor(Math.random() * 2) // 4-5 colors
  const hueSpread = 30 + Math.random() * 60 // 30-90 degree spread

  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1) // 0..1
    const hue = (baseHue + t * hueSpread) % 360
    const sat = 50 + Math.random() * 40 // 50-90%
    const lit = 8 + t * 62 + (Math.random() - 0.5) * 15 // ~8% to ~70%
    colors.push(hslToHex(hue, sat, Math.max(5, Math.min(80, lit))))
  }
  return colors
}

interface PlaygroundState {
  preset: PresetName
  colors: string[] | null // null = use preset colors
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
  colors: null,
  speed: 1.0,
  amplitude: 1.0,
  blur: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  noiseDetail: 4,
}

type Framework = 'react' | 'vue' | 'svelte' | 'vanilla'

function getActiveColors(state: PlaygroundState): string[] {
  if (state.colors) return state.colors
  return getPreset(state.preset).colors
}

function generateCode(framework: Framework, state: PlaygroundState): string {
  const opts: Record<string, unknown> = {}
  if (state.preset !== DEFAULTS.preset) opts.preset = state.preset
  if (state.colors) opts.colors = state.colors
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
    return `import { WaveMaker } from '@rising-company/wave-maker-core'

const canvas = document.getElementById('my-canvas')
const wm = new WaveMaker(canvas${optsStr})`
  }

  if (framework === 'react') {
    const propsStr = hasOpts ? formatJSXProps(opts) : ''
    return `import { WaveMaker } from '@rising-company/wave-maker-react'

export default function App() {
  return (
    <WaveMaker
      style={{ width: '100%', height: 400 }}${propsStr}
    />
  )
}`
  }

  if (framework === 'vue') {
    const propsStr = hasOpts ? formatVueProps(opts) : ''
    return `<template>
  <WaveMaker
    style="width: 100%; height: 400px"${propsStr}
  />
</template>

<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>`
  }

  // svelte
  const propsStr = hasOpts ? formatSvelteProps(opts) : ''
  return `<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<WaveMaker
  style="width: 100%; height: 400px"${propsStr}
/>`
}

function formatJSObject(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).map(([k, v]) => {
    if (typeof v === 'string') return `${k}: '${v}'`
    if (Array.isArray(v)) return `${k}: [${v.map(c => `'${c}'`).join(', ')}]`
    return `${k}: ${v}`
  })
  return `{ ${entries.join(', ')} }`
}

function formatJSXProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n      ${k}="${v}"`
      if (typeof v === 'boolean') return v ? `\n      ${k}` : `\n      ${k}={false}`
      if (Array.isArray(v)) return `\n      ${k}={[${v.map(c => `'${c}'`).join(', ')}]}`
      return `\n      ${k}={${v}}`
    })
    .join('')
}

function formatVueProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n    ${k}="${v}"`
      if (Array.isArray(v)) return `\n    :${k}="[${v.map(c => `'${c}'`).join(', ')}]"`
      return `\n    :${k}="${v}"`
    })
    .join('')
}

function formatSvelteProps(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `\n  ${k}="${v}"`
      if (typeof v === 'boolean') return v ? `\n  ${k}={true}` : `\n  ${k}={false}`
      if (Array.isArray(v)) return `\n  ${k}={[${v.map(c => `'${c}'`).join(', ')}]}`
      return `\n  ${k}={${v}}`
    })
    .join('')
}

export function createPlayground(container: HTMLElement): void {
  const state: PlaygroundState = { ...DEFAULTS }
  let wm: WaveMaker | null = null
  let activeFramework: Framework = 'vanilla'

  function recreate(): void {
    if (wm) { wm.destroy(); wm = null }
    const opts: any = { ...state }
    if (state.colors) opts.colors = state.colors
    else delete opts.colors
    wm = new WaveMaker(
      document.getElementById('pg-canvas') as HTMLCanvasElement,
      opts
    )
  }

  function updateCode(): void {
    const el = document.getElementById('pg-code-output')
    if (el) el.textContent = generateCode(activeFramework, state)
  }

  function renderColorSwatches(): void {
    const swatchContainer = document.getElementById('pg-color-swatches')
    if (!swatchContainer) return

    const colors = getActiveColors(state)
    swatchContainer.innerHTML = ''

    colors.forEach((color, i) => {
      const swatch = document.createElement('div')
      swatch.className = 'pg-color-swatch'
      swatch.style.backgroundColor = color
      swatch.title = color

      // Hidden color input
      const input = document.createElement('input')
      input.type = 'color'
      input.value = color
      input.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;'
      swatch.appendChild(input)

      swatch.addEventListener('click', () => input.click())

      input.addEventListener('input', () => {
        if (!state.colors) state.colors = [...getActiveColors(state)]
        state.colors[i] = input.value
        swatch.style.backgroundColor = input.value
        swatch.title = input.value
        recreate()
        updateCode()
      })

      // Remove button
      if (colors.length > 3) {
        const removeBtn = document.createElement('span')
        removeBtn.className = 'pg-color-remove'
        removeBtn.textContent = '\u00d7'
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!state.colors) state.colors = [...getActiveColors(state)]
          state.colors.splice(i, 1)
          recreate()
          updateCode()
          renderColorSwatches()
        })
        swatch.appendChild(removeBtn)
      }

      swatchContainer.appendChild(swatch)
    })

    // Add button (max 6)
    if (colors.length < 6) {
      const addBtn = document.createElement('div')
      addBtn.className = 'pg-color-swatch pg-color-add'
      addBtn.textContent = '+'
      addBtn.title = 'Add color'
      addBtn.addEventListener('click', () => {
        if (!state.colors) state.colors = [...getActiveColors(state)]
        state.colors.push('#ffffff')
        recreate()
        updateCode()
        renderColorSwatches()
      })
      swatchContainer.appendChild(addBtn)
    }

    // Reset button (only if custom colors)
    const resetBtn = document.getElementById('pg-color-reset')
    if (resetBtn) {
      resetBtn.style.display = state.colors ? '' : 'none'
    }
  }

  container.innerHTML = `
    <hr class="section-divider" />
    <section class="section">
      <div class="section-eyebrow">// Interactive &middot; Configuration</div>
      <h2 class="section-title">Playground</h2>
      <p class="section-desc">Tweak parameters &mdash; copy the code for your framework</p>

      <div class="pg-layout">
        <div class="pg-preview">
          <div class="showcase-canvas-wrapper" style="height: 500px;">
            <canvas id="pg-canvas"></canvas>
          </div>
        </div>

        <div class="pg-controls">
          <div class="pg-group">
            <label class="pg-label">Preset</label>
            <div class="pg-btn-group" id="pg-presets"></div>
          </div>

          <div class="pg-group">
            <label class="pg-label">Colors <button class="pg-color-reset-btn" id="pg-color-random">Random</button><button class="pg-color-reset-btn" id="pg-color-reset" style="display: none;">Reset</button></label>
            <div class="pg-color-swatches" id="pg-color-swatches"></div>
          </div>

          <div class="pg-group">
            <label class="pg-label">Speed <span id="pg-speed-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-speed" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <div class="pg-group">
            <label class="pg-label">Amplitude <span id="pg-amp-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-amp" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <div class="pg-group">
            <label class="pg-label">Blur <span id="pg-blur-val">1.0</span></label>
            <input type="range" class="pg-slider" id="pg-blur" min="0" max="3" step="0.1" value="1.0" />
          </div>

          <div class="pg-group">
            <label class="pg-label">Noise Detail <span id="pg-noise-val">4</span></label>
            <input type="range" class="pg-slider" id="pg-noise" min="1" max="6" step="1" value="4" />
          </div>

          <div class="pg-group">
            <label class="pg-label">Wave Count</label>
            <div class="pg-btn-group" id="pg-wave-count">
              <button class="pg-btn" data-val="1">1</button>
              <button class="pg-btn pg-btn--active" data-val="2">2</button>
              <button class="pg-btn" data-val="3">3</button>
            </div>
          </div>

          <div class="pg-group">
            <label class="pg-label">Valley</label>
            <div class="pg-btn-group" id="pg-valley">
              <button class="pg-btn" data-val="on">On</button>
              <button class="pg-btn pg-btn--active" data-val="off">Off</button>
            </div>
          </div>

          <div class="pg-group" id="pg-valley-depth-group" style="display: none;">
            <label class="pg-label">Valley Depth <span id="pg-vd-val">0.32</span></label>
            <input type="range" class="pg-slider" id="pg-vd" min="0" max="1" step="0.01" value="0.32" />
          </div>
        </div>
      </div>

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
    state.colors = null // reset custom colors on preset change
    presetGroup.querySelectorAll('.pg-btn').forEach((b) => b.classList.remove('pg-btn--active'))
    btn.classList.add('pg-btn--active')
    recreate()
    updateCode()
    renderColorSwatches()
  })

  // --- Color random ---
  document.getElementById('pg-color-random')!.addEventListener('click', () => {
    state.colors = generateRandomPalette()
    recreate()
    updateCode()
    renderColorSwatches()
  })

  // --- Color reset ---
  document.getElementById('pg-color-reset')!.addEventListener('click', () => {
    state.colors = null
    recreate()
    updateCode()
    renderColorSwatches()
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
      setTimeout(() => { copyBtn.textContent = 'Copy' }, 2000)
    })
  })

  // --- Init ---
  renderColorSwatches()
  recreate()
  updateCode()
}
