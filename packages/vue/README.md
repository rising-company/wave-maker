# @rising-company/wave-maker-vue

Vue 3 component for [wave-maker](https://github.com/rising-company/wave-maker) — beautiful animated WebGL wave gradients.

## Installation

```bash
npm install @rising-company/wave-maker-vue @rising-company/wave-maker-core
```

Requires Vue 3.3+.

## Quick Start

```vue
<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>

<template>
  <div style="position: relative; height: 100vh">
    <WaveMaker preset="stitch" valley class="absolute inset-0" />
    <div style="position: relative; z-index: 1">
      <h1>Your content</h1>
    </div>
  </div>
</template>
```

## Presets

`ocean` · `sunset` · `aurora` · `stitch` · `midnight` · `ember`

## Documentation

Full props, API, and examples: [github.com/rising-company/wave-maker](https://github.com/rising-company/wave-maker#readme)

## License

MIT
