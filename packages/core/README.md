# @rising-company/wave-maker-core

Beautiful animated WebGL wave gradient effects for the web. Vanilla JS core — no framework dependencies.

> Looking for a framework wrapper? See [`@rising-company/wave-maker-react`](https://www.npmjs.com/package/@rising-company/wave-maker-react), [`@rising-company/wave-maker-vue`](https://www.npmjs.com/package/@rising-company/wave-maker-vue), or [`@rising-company/wave-maker-svelte`](https://www.npmjs.com/package/@rising-company/wave-maker-svelte).

## Installation

```bash
npm install @rising-company/wave-maker-core
```

## Quick Start

```js
import { WaveMaker } from '@rising-company/wave-maker-core'

const canvas = document.querySelector('canvas')
const wave = new WaveMaker(canvas, { preset: 'ocean' })

// Later
wave.pause()
wave.setPreset('sunset')
wave.destroy()
```

## Presets

`ocean` · `sunset` · `aurora` · `stitch` · `midnight` · `ember`

## Documentation

Full options, API, and examples: [github.com/rising-company/wave-maker](https://github.com/rising-company/wave-maker#readme)

## License

MIT
