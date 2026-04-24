# wave-maker Design Spec

## Overview

An open-source npm library for generating beautiful, animated WebGL wave gradient effects. Inspired by [Alex Harri's "A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) and the animated background on [Google Stitch](https://stitch.withgoogle.com/).

**Target audience:** Frontend developers who want a drop-in animated wave background with minimal WebGL knowledge.

**Scope (v1):** Wave gradients.

## Package Structure

Monorepo with pnpm workspaces. Four packages:

| Package | npm Name | Description |
|---------|----------|-------------|
| `packages/core` | `@rising-company/wave-maker` | Vanilla JS core — WebGL renderer, shaders, presets |
| `packages/react` | `@rising-company/wave-maker-react` | React component wrapper |
| `packages/vue` | `@rising-company/wave-maker-vue` | Vue component wrapper |
| `packages/svelte` | `@rising-company/wave-maker-svelte` | Svelte component wrapper |
| `demo/` | (not published) | Interactive demo site |

Framework wrappers have a peer dependency on the core package.

## Core API

### Full Type Definitions

```typescript
// ---- Types ----

type PresetName = 'ocean' | 'sunset' | 'aurora' | 'stitch' | 'midnight' | 'ember'

interface WaveMakerOptions {
  /** Named color theme. Default: 'ocean' */
  preset?: PresetName
  /** Override preset colors (3-6 hex values) */
  colors?: string[]
  /** Animation speed multiplier. 0 = frozen. Default: 1.0 */
  speed?: number
  /** Wave height multiplier. Default: 1.0 */
  amplitude?: number
  /** Number of wave layers. Default: 2 */
  waveCount?: 1 | 2 | 3
  /** Stitch-style center valley for overlaying UI content. Default: false */
  valley?: boolean
  /** Valley dip depth (0-1). Only applies when valley is true. Default: 0.32 */
  valleyDepth?: number
  /** Edge blur intensity. Default: 1.0 */
  blur?: number
  /** Noise octaves (1-6). More = richer detail, higher GPU cost. Default: 4 */
  noiseDetail?: number
  /** Target frame rate cap. Default: 60 */
  fps?: number
  /** Device pixel ratio. Default: window.devicePixelRatio */
  pixelRatio?: number
  /** Auto-start animation on creation. Default: true */
  animate?: boolean
}

interface Preset {
  name: string
  /** 3-6 hex color strings */
  colors: string[]
  /** Default option overrides for this preset */
  defaults?: Partial<Omit<WaveMakerOptions, 'preset' | 'colors'>>
}

// ---- Core class ----

declare class WaveMaker {
  constructor(canvas: HTMLCanvasElement, options?: WaveMakerOptions)

  /** Resume animation */
  play(): void
  /** Pause animation */
  pause(): void
  /** Cleanup WebGL context, stop animation, remove listeners */
  destroy(): void
  /** Manually trigger resize (auto via ResizeObserver) */
  resize(): void
  /** Switch preset with smooth color transition */
  setPreset(name: PresetName): void
  /** Override gradient colors */
  setColors(colors: string[]): void
  /** Update animation speed */
  setSpeed(speed: number): void
  /** Update wave height */
  setAmplitude(amplitude: number): void

  /** Whether animation is currently playing */
  readonly isPlaying: boolean
  /** Current active preset name, or null if using custom colors */
  readonly currentPreset: PresetName | null
}

// ---- React ----

// @rising-company/wave-maker-react
interface WaveMakerProps extends WaveMakerOptions {
  className?: string
  style?: React.CSSProperties
  id?: string
}

declare function WaveMaker(props: WaveMakerProps): React.JSX.Element

// ---- Vue ----

// @rising-company/wave-maker-vue
// <WaveMaker preset="ocean" valley :speed="0.8" class="absolute inset-0" />
// Props map 1:1 to WaveMakerOptions

// ---- Svelte ----

// @rising-company/wave-maker-svelte
// <WaveMaker preset="aurora" valley speed={1.2} class="absolute inset-0" />
// Props map 1:1 to WaveMakerOptions
```

## Presets

Each preset defines a color palette and tuned defaults for wave geometry:

| Preset | Colors | Notes |
|--------|--------|-------|
| `ocean` | Deep blues, teals, seafoam | Default. Flowing horizontal waves. |
| `sunset` | Oranges, purples, pinks | Warm, dramatic gradients. |
| `aurora` | Greens, cyans, magentas | Northern lights feel. |
| `stitch` | Purple/indigo + amber/cream | Google Stitch-inspired. Defaults: `valley: true`. |
| `midnight` | Dark blues, silver, slate | Subtle, dark-mode friendly. |
| `ember` | Reds, golds, deep black | Fiery, high contrast. |

A preset is a plain object:

```typescript
interface Preset {
  name: string
  colors: string[]          // 3-6 hex color strings
  defaults?: Partial<Omit<WaveMakerOptions, 'preset' | 'colors'>>
}
```

User-supplied options override preset defaults.

## Framework Wrappers

### React

```tsx
import { WaveMaker } from '@rising-company/wave-maker-react'

<WaveMaker
  preset="stitch"
  valley
  speed={0.8}
  className="absolute inset-0"
/>
```

- Props map 1:1 to `WaveMakerOptions` plus standard HTML div attributes (`className`, `style`, `id`, etc.)
- The component renders a `<canvas>` inside a `<div>` wrapper
- Creates the core `WaveMaker` instance in a `useEffect`, destroys on unmount
- Prop changes call the corresponding `setX()` method (no re-instantiation)
- SSR-safe: renders the wrapper div on server, initializes WebGL only on client

### Vue

```vue
<template>
  <WaveMaker preset="ocean" valley :speed="0.8" class="absolute inset-0" />
</template>

<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>
```

- Props map 1:1 to `WaveMakerOptions`
- `onMounted` / `onBeforeUnmount` lifecycle for create/destroy
- Watchers on props call `setX()` methods

### Svelte

```svelte
<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<WaveMaker preset="aurora" valley speed={1.2} class="absolute inset-0" />
```

- Props map 1:1 to `WaveMakerOptions`
- Svelte 5 with `$effect` for lifecycle and reactivity
- `$effect` creates the core instance on mount, returns cleanup function
- Reactive `$derived` or `$effect` watches trigger `setX()` on prop changes

## Shader Architecture

### Pipeline

The fragment shader composes four stages:

1. **Noise** — Simplex 2D and 3D noise functions (from Ashima Arts / Stefan Gustavson, MIT license). Stacked octaves for fractal detail.

2. **Wave Shape** — 6 stacked sine waves at different frequencies and phase speeds, some traveling in opposing directions for organic motion. Optional valley geometry adds a parabolic curve: `valley = depth * (x - 0.5)^2` that pushes waves high on the sides and dips in the center. Simplex noise perturbs the wave boundary.

3. **Edge Blur** — Signed distance from the wave curve. Blur radius is modulated by layered simplex noise (fbm), producing irregular, breathing edge softness. Smoothstep function for the alpha transition.

4. **Color** — Background noise generates a lightness value (0-1). Each wave layer has its own lightness value (computed with different time offsets to decorrelate). Layers are composited via `mix()` weighted by wave alpha. Final color is a texture lookup from a 1x256 gradient texture.

### Uniforms

Updated every frame:
- `u_time` — elapsed seconds
- `u_resolution` — canvas width, height

Updated on config change:
- `u_gradient` — 1D gradient texture (sampler2D)
- `u_speed` — speed multiplier
- `u_amplitude` — wave height multiplier
- `u_valley` — valley enabled (0.0 or 1.0)
- `u_valley_depth` — valley dip amount
- `u_blur` — blur intensity
- `u_wave_count` — number of wave layers (1-3)
- `u_noise_detail` — number of noise octaves

### Gradient Texture

Colors are rendered to a 1x256 canvas using a 2D context linear gradient, then uploaded as a WebGL texture via `texImage2D`. The fragment shader samples it with `texture2D(u_gradient, vec2(t, 0.5))` where `t` is a noise-derived lightness value.

This decouples color from shader math — palette changes only re-upload the texture, no shader recompilation. Preset transitions interpolate between two gradient textures over ~500ms.

### WebGL Version Handling

- Attempt `canvas.getContext('webgl2')` first
- Fall back to `canvas.getContext('webgl')` or `canvas.getContext('experimental-webgl')`
- Shader source uses `#ifdef` or template injection to handle version differences (e.g., `texture` vs `texture2D`, `in`/`out` vs `varying`)

## Demo Site

Built with Vite. Served from the `demo/` directory. Uses the core package directly (workspace link).

### Layout

1. **Hero section** — Uses wave-maker itself as the background (dog-fooding).

2. **Preset showcase: Stitch Style** — Full-width live demo with valley geometry enabled. Content overlaid in the valley to show the intended use case.

3. **Preset showcase: Alex Harri Style** — Full-width live demo with flowing horizontal waves, no valley. Shows the classic gradient wave effect.

4. **Playground** — Interactive section:
   - **Live preview** (left) — Full canvas with the current effect
   - **Controls panel** (right):
     - Preset selector (button group)
     - Speed, amplitude, blur sliders
     - Wave count toggle (1 / 2 / 3)
     - Valley on/off toggle
     - Valley depth slider (visible when valley is on)
     - Noise detail slider
     - Color picker with add/remove swatches
   - **Code output** (below) — Tabbed by framework (React / Vue / Svelte / Vanilla JS). Code updates live as parameters change. Copy button.

## LLM Support

### `llms.txt`

A structured text file at the repo root (and served at the demo site root) following the [llms.txt convention](https://llmstxt.org/). Contains:

- Library name, description, and purpose
- Installation commands for each package
- Complete API reference (constructor, options, methods)
- All preset names and their descriptions
- Usage examples for each framework
- Common patterns (hero background, full-page, with overlaid content)

This enables LLMs to generate correct wave-maker code without needing to read the full source.

### `llms-full.txt`

An extended version with additional detail: all preset color values, shader uniform descriptions, and advanced configuration patterns.

## Build & Tooling

| Tool | Purpose |
|------|---------|
| pnpm workspaces | Monorepo package management |
| TypeScript (strict) | Type safety across all packages |
| tsup | Build ESM + CJS bundles with .d.ts generation |
| Raw string imports (`?raw`) | Inline GLSL shader files at build time (tsup/vite native, no plugin) |
| Vitest | Unit tests |
| Vite | Demo site dev server and build |

### Output

- ESM (tree-shakeable) + CJS per package
- Full `.d.ts` type definitions
- GLSL inlined as strings at build time (no runtime file loading)
- Core target: ~8-12 KB gzipped

## Acknowledgements

Included in README, LICENSE header, and `llms.txt`:

- **Alex Harri** — Wave gradient technique, shader architecture, and the blog post ["A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) that inspired this library's core approach.
- **Ian McEwan & Ashima Arts / Stefan Gustavson (stegu)** — Simplex noise GLSL implementation ([stegu/webgl-noise](https://github.com/stegu/webgl-noise), MIT License).
- **Google Stitch** — Visual inspiration for valley geometry and dramatic wave styling.

## License

MIT
