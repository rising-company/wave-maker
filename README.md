# wave-maker

Beautiful animated WebGL wave gradient effects for the web.

Inspired by [Alex Harri's "A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) and [Google Stitch](https://stitch.withgoogle.com/).

---

## Installation

**Core (vanilla JS):**
```bash
npm install @rising-company/wave-maker
```

**React:**
```bash
npm install @rising-company/wave-maker-react @rising-company/wave-maker
```

**Vue:**
```bash
npm install @rising-company/wave-maker-vue @rising-company/wave-maker
```

**Svelte:**
```bash
npm install @rising-company/wave-maker-svelte @rising-company/wave-maker
```

---

## Quick Start

### Vanilla JS

```js
import { WaveMaker } from '@rising-company/wave-maker'

const wave = new WaveMaker(document.querySelector('canvas'), { preset: 'ocean' })
```

### React

```jsx
import { WaveMaker } from '@rising-company/wave-maker-react'

export default function App() {
  return <WaveMaker preset="ocean" className="absolute inset-0" />
}
```

### Vue

```vue
<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>

<template>
  <WaveMaker preset="ocean" class="absolute inset-0" />
</template>
```

### Svelte

```svelte
<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<WaveMaker preset="ocean" class="absolute inset-0" />
```

---

## Presets

| Preset | Description |
|--------|-------------|
| `ocean` | Deep blues, teals, seafoam |
| `sunset` | Oranges, purples, pinks |
| `aurora` | Greens, cyans, magentas |
| `stitch` | Purple/indigo + amber/cream (valley enabled by default) |
| `midnight` | Dark blues, silver, slate |
| `ember` | Reds, golds, deep black |

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | `'ocean'`\|`'sunset'`\|`'aurora'`\|`'stitch'`\|`'midnight'`\|`'ember'` | `'ocean'` | Color theme |
| `colors` | `string[]` | from preset | Custom gradient colors (3–6 hex values) |
| `speed` | `number` | `1.0` | Animation speed (0 = frozen) |
| `amplitude` | `number` | `1.0` | Wave height multiplier |
| `waveCount` | `1`\|`2`\|`3` | `2` | Number of wave layers |
| `valley` | `boolean` | `false` | Center valley for overlaying content |
| `valleyDepth` | `number` | `0.32` | Valley depth (0–1) |
| `blur` | `number` | `1.0` | Edge blur intensity |
| `noiseDetail` | `number` | `4` | Noise octaves (1–6) |
| `fps` | `number` | `60` | Frame rate cap |
| `pixelRatio` | `number` | `devicePixelRatio` | Rendering resolution |
| `animate` | `boolean` | `true` | Auto-start |

---

## API

### Constructor

```ts
new WaveMaker(canvas: HTMLCanvasElement, options?: WaveMakerOptions)
```

### Methods

| Method | Description |
|--------|-------------|
| `wave.play()` | Resume animation |
| `wave.pause()` | Pause animation |
| `wave.destroy()` | Cleanup WebGL context and observers |
| `wave.resize()` | Manually trigger a resize |
| `wave.setPreset(name)` | Switch to a named preset |
| `wave.setColors(colors)` | Set custom gradient colors |
| `wave.setSpeed(n)` | Update animation speed |
| `wave.setAmplitude(n)` | Update wave amplitude |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `wave.isPlaying` | `boolean` | Whether the animation is currently running |
| `wave.currentPreset` | `PresetName \| null` | The active preset name, or null if using custom colors |

---

## Common Patterns

### Hero background with content overlay

```jsx
<div style={{ position: 'relative', height: '100vh' }}>
  <WaveMaker preset="stitch" valley className="absolute inset-0" />
  <div style={{ position: 'relative', zIndex: 1 }}>
    <h1>Your content here</h1>
  </div>
</div>
```

### Full-page background

```jsx
<WaveMaker preset="ocean" style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
```

---

## Acknowledgements

- **[Alex Harri](https://alexharri.com)** — Wave gradient technique and the blog post ["A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) that inspired this library.
- **Ian McEwan, Ashima Arts & [Stefan Gustavson (stegu)](https://github.com/stegu/webgl-noise)** — Simplex noise GLSL implementation (MIT License).
- **[Google Stitch](https://stitch.withgoogle.com/)** — Visual inspiration for valley geometry and dramatic wave styling.

---

## License

MIT
