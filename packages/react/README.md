# @rising-company/wave-maker-react

React component for [wave-maker](https://github.com/rising-company/wave-maker) — beautiful animated WebGL wave gradients.

## Installation

```bash
npm install @rising-company/wave-maker-react @rising-company/wave-maker-core
```

Requires React 18 or 19.

## Quick Start

```jsx
import { WaveMaker } from '@rising-company/wave-maker-react'

export default function Hero() {
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <WaveMaker preset="stitch" valley className="absolute inset-0" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your content</h1>
      </div>
    </div>
  )
}
```

## Presets

`ocean` · `sunset` · `aurora` · `stitch` · `midnight` · `ember`

## Documentation

Full props, API, and examples: [github.com/rising-company/wave-maker](https://github.com/rising-company/wave-maker#readme)

## License

MIT
