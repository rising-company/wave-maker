# @rising-company/wave-maker-svelte

Svelte 5 component for [wave-maker](https://github.com/rising-company/wave-maker) — beautiful animated WebGL wave gradients.

## Installation

```bash
npm install @rising-company/wave-maker-svelte @rising-company/wave-maker-core
```

Requires Svelte 5.

## Quick Start

```svelte
<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<div style="position: relative; height: 100vh">
  <WaveMaker preset="stitch" valley class="absolute inset-0" />
  <div style="position: relative; z-index: 1">
    <h1>Your content</h1>
  </div>
</div>
```

## Presets

`ocean` · `sunset` · `aurora` · `stitch` · `midnight` · `ember`

## Documentation

Full props, API, and examples: [github.com/rising-company/wave-maker](https://github.com/rising-company/wave-maker#readme)

## License

MIT
