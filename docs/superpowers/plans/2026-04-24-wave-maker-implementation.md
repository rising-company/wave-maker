# wave-maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@rising-company/wave-maker`, an npm library for animated WebGL wave gradient effects with React/Vue/Svelte wrappers and an interactive demo site.

**Architecture:** Monorepo with pnpm workspaces. Core package contains the WebGL renderer, GLSL shaders (simplex noise from Ashima Arts/stegu, MIT), and preset themes. Framework wrappers are thin lifecycle bridges. GLSL is stored as TypeScript string exports (no build plugin needed). Gradient colors use a 1x256 texture generated on CPU.

**Tech Stack:** TypeScript (strict), pnpm workspaces, tsup (ESM+CJS builds), Vitest, Vite (demo site), React 19, Vue 3, Svelte 5.

---

## File Structure

```
wave-maker/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── index.ts                  — public exports
│   │   │   ├── types.ts                  — WaveMakerOptions, Preset, PresetName
│   │   │   ├── wave-maker.ts             — main WaveMaker class
│   │   │   ├── shaders/
│   │   │   │   ├── noise.ts              — simplex 2D/3D GLSL strings
│   │   │   │   ├── vertex.ts             — vertex shader GLSL string
│   │   │   │   └── fragment.ts           — fragment shader GLSL string
│   │   │   ├── renderer/
│   │   │   │   ├── webgl-context.ts      — WebGL 1/2 context creation
│   │   │   │   ├── shader-compiler.ts    — compile + link shader program
│   │   │   │   ├── gradient-texture.ts   — 1x256 gradient texture from colors
│   │   │   │   └── animation-loop.ts     — rAF loop with FPS cap
│   │   │   └── presets/
│   │   │       ├── index.ts              — preset registry + getPreset()
│   │   │       ├── ocean.ts
│   │   │       ├── sunset.ts
│   │   │       ├── aurora.ts
│   │   │       ├── stitch.ts
│   │   │       ├── midnight.ts
│   │   │       └── ember.ts
│   │   ├── __tests__/
│   │   │   ├── presets.test.ts
│   │   │   ├── gradient-texture.test.ts
│   │   │   └── options.test.ts
│   │   ├── tsup.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── react/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── WaveMaker.tsx
│   │   ├── tsup.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── vue/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── WaveMaker.vue
│   │   ├── tsup.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── svelte/
│       ├── src/
│       │   ├── index.ts
│       │   └── WaveMaker.svelte
│       ├── tsup.config.ts
│       ├── package.json
│       └── tsconfig.json
├── demo/
│   ├── index.html
│   ├── src/
│   │   ├── main.ts
│   │   ├── sections/
│   │   │   ├── hero.ts
│   │   │   ├── showcase.ts
│   │   │   └── playground.ts
│   │   └── style.css
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── llms.txt
├── llms-full.txt
├── README.md
├── LICENSE
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── .gitignore
```

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/tsup.config.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "wave-maker-monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "dev": "pnpm --filter demo dev"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "demo"
```

- [ ] **Step 3: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

- [ ] **Step 4: Update .gitignore**

```
node_modules/
dist/
.superpowers/
*.tsbuildinfo
```

- [ ] **Step 5: Create core package.json**

```json
{
  "name": "@rising-company/wave-maker",
  "version": "0.1.0",
  "description": "Beautiful animated WebGL wave gradient effects",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["webgl", "gradient", "wave", "animation", "shader"],
  "license": "MIT",
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 6: Create core tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create core tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
})
```

- [ ] **Step 8: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, node_modules populated

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json .gitignore packages/core/package.json packages/core/tsconfig.json packages/core/tsup.config.ts pnpm-lock.yaml
git commit -m "feat: scaffold monorepo with core package"
```

---

### Task 2: Core Types and Presets

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/presets/ocean.ts`, `sunset.ts`, `aurora.ts`, `stitch.ts`, `midnight.ts`, `ember.ts`, `index.ts`
- Create: `packages/core/__tests__/presets.test.ts`

- [ ] **Step 1: Write preset tests**

```typescript
// packages/core/__tests__/presets.test.ts
import { describe, it, expect } from 'vitest'
import { getPreset, presetNames } from '../src/presets'

describe('presets', () => {
  it('exports all 6 preset names', () => {
    expect(presetNames).toEqual(['ocean', 'sunset', 'aurora', 'stitch', 'midnight', 'ember'])
  })

  it('getPreset returns a preset by name', () => {
    const ocean = getPreset('ocean')
    expect(ocean.name).toBe('ocean')
    expect(ocean.colors.length).toBeGreaterThanOrEqual(3)
    expect(ocean.colors.length).toBeLessThanOrEqual(6)
  })

  it('every preset has 3-6 hex color strings', () => {
    for (const name of presetNames) {
      const preset = getPreset(name)
      expect(preset.colors.length).toBeGreaterThanOrEqual(3)
      expect(preset.colors.length).toBeLessThanOrEqual(6)
      for (const color of preset.colors) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it('stitch preset defaults valley to true', () => {
    const stitch = getPreset('stitch')
    expect(stitch.defaults?.valley).toBe(true)
  })

  it('getPreset throws for unknown preset', () => {
    expect(() => getPreset('nonexistent' as any)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/presets.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create types.ts**

```typescript
// packages/core/src/types.ts
export type PresetName = 'ocean' | 'sunset' | 'aurora' | 'stitch' | 'midnight' | 'ember'

export interface WaveMakerOptions {
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

export interface Preset {
  name: string
  /** 3-6 hex color strings */
  colors: string[]
  /** Default option overrides for this preset */
  defaults?: Partial<Omit<WaveMakerOptions, 'preset' | 'colors'>>
}

export const DEFAULT_OPTIONS: Required<Omit<WaveMakerOptions, 'preset' | 'colors'>> = {
  speed: 1.0,
  amplitude: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  blur: 1.0,
  noiseDetail: 4,
  fps: 60,
  pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  animate: true,
}
```

- [ ] **Step 4: Create preset files**

```typescript
// packages/core/src/presets/ocean.ts
import type { Preset } from '../types'

export const ocean: Preset = {
  name: 'ocean',
  colors: ['#0a2342', '#1a5276', '#2e86c1', '#48c9b0', '#76d7c4', '#d4efdf'],
}
```

```typescript
// packages/core/src/presets/sunset.ts
import type { Preset } from '../types'

export const sunset: Preset = {
  name: 'sunset',
  colors: ['#2c0e37', '#6c3483', '#e74c3c', '#f39c12', '#f5b041', '#fad7a0'],
}
```

```typescript
// packages/core/src/presets/aurora.ts
import type { Preset } from '../types'

export const aurora: Preset = {
  name: 'aurora',
  colors: ['#0b0c10', '#1a472a', '#2ecc71', '#1abc9c', '#5dade2', '#af7ac5'],
}
```

```typescript
// packages/core/src/presets/stitch.ts
import type { Preset } from '../types'

export const stitch: Preset = {
  name: 'stitch',
  colors: ['#1a0533', '#4a0e8f', '#6b3fa0', '#c9a87c', '#d4a574', '#f5e6d3'],
  defaults: {
    valley: true,
    amplitude: 1.2,
  },
}
```

```typescript
// packages/core/src/presets/midnight.ts
import type { Preset } from '../types'

export const midnight: Preset = {
  name: 'midnight',
  colors: ['#0a0e27', '#1a1f4e', '#2c3e7a', '#7f8c9b', '#b0bec5', '#cfd8dc'],
}
```

```typescript
// packages/core/src/presets/ember.ts
import type { Preset } from '../types'

export const ember: Preset = {
  name: 'ember',
  colors: ['#1a0000', '#4a0000', '#c0392b', '#e67e22', '#f1c40f', '#fde68a'],
}
```

```typescript
// packages/core/src/presets/index.ts
import type { Preset, PresetName } from '../types'
import { ocean } from './ocean'
import { sunset } from './sunset'
import { aurora } from './aurora'
import { stitch } from './stitch'
import { midnight } from './midnight'
import { ember } from './ember'

const presets: Record<PresetName, Preset> = {
  ocean,
  sunset,
  aurora,
  stitch,
  midnight,
  ember,
}

export const presetNames: PresetName[] = ['ocean', 'sunset', 'aurora', 'stitch', 'midnight', 'ember']

export function getPreset(name: PresetName): Preset {
  const preset = presets[name]
  if (!preset) {
    throw new Error(`Unknown preset: "${name}". Available: ${presetNames.join(', ')}`)
  }
  return preset
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/core && npx vitest run __tests__/presets.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/presets/ packages/core/__tests__/presets.test.ts
git commit -m "feat: add core types and preset definitions"
```

---

### Task 3: GLSL Shaders

**Files:**
- Create: `packages/core/src/shaders/noise.ts`
- Create: `packages/core/src/shaders/vertex.ts`
- Create: `packages/core/src/shaders/fragment.ts`

Shaders are stored as exported TypeScript strings. No build plugin needed.

- [ ] **Step 1: Create simplex noise shader**

```typescript
// packages/core/src/shaders/noise.ts
// Simplex noise GLSL implementation
// Original: Ian McEwan, Ashima Arts (MIT License)
// https://github.com/ashima/webgl-noise
// https://github.com/stegu/webgl-noise

export const noiseGLSL = /* glsl */ `
vec3 mod289_v3(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289_v4(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289_v2(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute_v3(vec3 x) {
  return mod289_v3(((x * 34.0) + 10.0) * x);
}

vec4 permute_v4(vec4 x) {
  return mod289_v4(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// 2D Simplex Noise
float snoise2(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
    -0.577350269189626,  // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289_v2(i);
  vec3 p = permute_v3(permute_v3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// 3D Simplex Noise
float snoise3(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289_v3(i);
  vec4 p = permute_v4(permute_v4(permute_v4(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x_v = x_ * ns.x + ns.yyyy;
  vec4 y_v = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x_v) - abs(y_v);

  vec4 b0 = vec4(x_v.xy, y_v.xy);
  vec4 b1 = vec4(x_v.zw, y_v.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;

  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;

  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`
```

- [ ] **Step 2: Create vertex shader**

```typescript
// packages/core/src/shaders/vertex.ts
export const vertexShaderSource = /* glsl */ `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`
```

- [ ] **Step 3: Create fragment shader**

This is the core effect — adapted from Alex Harri's technique with configurable uniforms.

```typescript
// packages/core/src/shaders/fragment.ts
import { noiseGLSL } from './noise'

export function buildFragmentShader(isWebGL2: boolean): string {
  const versionHeader = isWebGL2 ? '#version 300 es\n' : ''
  const precisionHeader = 'precision mediump float;\n'
  const fragColor = isWebGL2 ? 'outColor' : 'gl_FragColor'
  const textureFunc = isWebGL2 ? 'texture' : 'texture2D'
  const fragOutDecl = isWebGL2 ? 'out vec4 outColor;\n' : ''

  return `${versionHeader}${precisionHeader}
${fragOutDecl}
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_gradient;
uniform float u_speed;
uniform float u_amplitude;
uniform float u_valley;
uniform float u_valley_depth;
uniform float u_blur;
uniform float u_wave_count;
uniform float u_noise_detail;

${noiseGLSL}

// Smoothstep (quintic Hermite)
float smooth5(float t) {
  return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}

float lerp(float a, float b, float t) {
  return a * (1.0 - t) + b * t;
}

// Wave boundary noise — stacked 2D simplex at different frequencies
float wave_y_noise(float offset) {
  float time = u_time * u_speed + offset;
  float x = gl_FragCoord.x * 0.000845;
  float y = time * 0.075;
  float x_shift = time * 0.026;

  float sum = 0.0;
  sum += snoise2(vec2(x * 1.30 + x_shift, y * 0.54)) * 0.85;
  sum += snoise2(vec2(x * 1.00 + x_shift, y * 0.68)) * 1.15;
  sum += snoise2(vec2(x * 0.70 + x_shift, y * 0.59)) * 0.60;
  sum += snoise2(vec2(x * 0.40 + x_shift, y * 0.48)) * 0.40;
  // Additional sine waves for richer shape
  sum += sin(x * 6.28 * 800.0 + time * 0.9) * 0.15;
  sum += sin(x * 5.45 * 800.0 - time * 0.75) * 0.10;
  return sum;
}

// Blur radius modulated by noise
float calc_blur(float offset) {
  float time = u_time * u_speed + offset;
  float x = gl_FragCoord.x * 0.0011;

  float blur_fac = -0.1;
  blur_fac += snoise2(vec2(x * 0.60 + time * 0.03, time * 0.05)) * 0.5;
  blur_fac += snoise2(vec2(x * 1.30 - time * 0.024, time * 0.07)) * 0.4;
  blur_fac = clamp((blur_fac + 1.0) * 0.5, 0.0, 1.0);
  return blur_fac;
}

// Wave alpha (distance from wave curve with blur)
float wave_alpha(float wave_y_base, float wave_height, float offset) {
  float nx = gl_FragCoord.x / u_resolution.x;

  // Valley geometry: parabolic dip in center
  float valley_offset = u_valley * u_valley_depth * u_resolution.y * 4.0 * (nx - 0.5) * (nx - 0.5);

  float wave_y = wave_y_base + valley_offset + wave_y_noise(offset) * wave_height * u_amplitude;
  float dist = wave_y - gl_FragCoord.y;
  float blur_fac = calc_blur(offset);

  float blur_amount = u_blur * 345.0;
  float v = pow(blur_fac, 1.05);
  v = smooth5(clamp(v, 0.008, 1.0));
  v *= blur_amount;

  float alpha = clamp(0.5 + dist / max(v, 1.0), 0.0, 1.0);
  alpha = smooth5(alpha);
  return alpha;
}

// Background noise for color variation — stacked 3D simplex
float background_noise(float offset) {
  float time = u_time * u_speed + offset;
  float x = gl_FragCoord.x * 0.00085;
  float y = gl_FragCoord.y * 0.00085 * 3.7;
  float x_shift = time * 0.04;

  float sum = 0.5;
  sum += snoise3(vec3(x * 1.5 + x_shift * 1.1, y * 1.0, time * 0.064)) * 0.30;
  if (u_noise_detail >= 2.0)
    sum += snoise3(vec3(x * 0.9 - x_shift * 0.6, y * 0.85, time * 0.064)) * 0.25;
  if (u_noise_detail >= 3.0)
    sum += snoise3(vec3(x * 0.6 + x_shift * 0.8, y * 0.70, time * 0.064)) * 0.20;
  if (u_noise_detail >= 4.0)
    sum += snoise3(vec3(x * 0.4 + x_shift * 0.5, y * 0.55, time * 0.064)) * 0.12;
  if (u_noise_detail >= 5.0)
    sum += snoise3(vec3(x * 2.0 - x_shift * 0.9, y * 1.2, time * 0.064)) * 0.08;
  if (u_noise_detail >= 6.0)
    sum += snoise3(vec3(x * 2.5 + x_shift * 1.3, y * 1.5, time * 0.064)) * 0.05;

  return clamp(sum, 0.0, 1.0);
}

void main() {
  float h = u_resolution.y;

  // Wave positions (as fraction of height)
  float w1_y = 0.45 * h;
  float w2_y = 0.75 * h;
  float w3_y = 0.25 * h;

  float w1_height = 0.195 * h;
  float w2_height = 0.144 * h;
  float w3_height = 0.12 * h;

  // Background lightness
  float bg_lightness = background_noise(-192.4);

  // Wave lightness (different time offsets decorrelate)
  float w1_lightness = background_noise(273.3);
  float w2_lightness = background_noise(623.1);
  float w3_lightness = background_noise(911.7);

  // Wave alphas
  float w1_alpha = wave_alpha(w1_y, w1_height, 5475.0);
  float w2_alpha = u_wave_count >= 2.0 ? wave_alpha(w2_y, w2_height, 8100.0) : 0.0;
  float w3_alpha = u_wave_count >= 3.0 ? wave_alpha(w3_y, w3_height, 12300.0) : 0.0;

  // Composite lightness
  float lightness = bg_lightness;
  lightness = lerp(lightness, w1_lightness, w1_alpha);
  lightness = lerp(lightness, w2_lightness, w2_alpha);
  lightness = lerp(lightness, w3_lightness, w3_alpha);

  // Sample gradient texture
  vec3 color = ${textureFunc}(u_gradient, vec2(clamp(lightness, 0.0, 1.0), 0.5)).rgb;
  ${fragColor} = vec4(color, 1.0);
}
`
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/shaders/
git commit -m "feat: add GLSL shaders (simplex noise, wave fragment, vertex)"
```

---

### Task 4: WebGL Renderer Utilities

**Files:**
- Create: `packages/core/src/renderer/webgl-context.ts`
- Create: `packages/core/src/renderer/shader-compiler.ts`
- Create: `packages/core/src/renderer/gradient-texture.ts`
- Create: `packages/core/src/renderer/animation-loop.ts`
- Create: `packages/core/__tests__/gradient-texture.test.ts`

- [ ] **Step 1: Write gradient texture tests**

```typescript
// packages/core/__tests__/gradient-texture.test.ts
import { describe, it, expect } from 'vitest'
import { createGradientCanvas } from '../src/renderer/gradient-texture'

describe('createGradientCanvas', () => {
  it('creates a 256x1 canvas', () => {
    const canvas = createGradientCanvas(['#ff0000', '#00ff00', '#0000ff'])
    expect(canvas.width).toBe(256)
    expect(canvas.height).toBe(1)
  })

  it('throws if fewer than 3 colors', () => {
    expect(() => createGradientCanvas(['#ff0000', '#00ff00'])).toThrow()
  })

  it('throws if more than 6 colors', () => {
    expect(() =>
      createGradientCanvas(['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ffffff'])
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/gradient-texture.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create webgl-context.ts**

```typescript
// packages/core/src/renderer/webgl-context.ts
export interface WebGLContextResult {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  isWebGL2: boolean
}

export function createWebGLContext(canvas: HTMLCanvasElement): WebGLContextResult {
  const gl2 = canvas.getContext('webgl2')
  if (gl2) {
    return { gl: gl2, isWebGL2: true }
  }

  const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (gl1) {
    return { gl: gl1 as WebGLRenderingContext, isWebGL2: false }
  }

  throw new Error('WebGL is not supported in this browser')
}
```

- [ ] **Step 4: Create shader-compiler.ts**

```typescript
// packages/core/src/renderer/shader-compiler.ts
export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }

  return shader
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create program')

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`Program link error: ${info}`)
  }

  // Shaders can be detached after linking
  gl.detachShader(program, vertexShader)
  gl.detachShader(program, fragmentShader)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  return program
}
```

- [ ] **Step 5: Create gradient-texture.ts**

```typescript
// packages/core/src/renderer/gradient-texture.ts
const GRADIENT_WIDTH = 256
const GRADIENT_HEIGHT = 1

export function createGradientCanvas(colors: string[]): HTMLCanvasElement {
  if (colors.length < 3 || colors.length > 6) {
    throw new Error(`Expected 3-6 colors, got ${colors.length}`)
  }

  const canvas = document.createElement('canvas')
  canvas.width = GRADIENT_WIDTH
  canvas.height = GRADIENT_HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D context')

  const gradient = ctx.createLinearGradient(0, 0, GRADIENT_WIDTH, 0)
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color)
  })

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GRADIENT_WIDTH, GRADIENT_HEIGHT)

  return canvas
}

export function uploadGradientTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  colors: string[]
): void {
  const canvas = createGradientCanvas(colors)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
}
```

- [ ] **Step 6: Create animation-loop.ts**

```typescript
// packages/core/src/renderer/animation-loop.ts
export class AnimationLoop {
  private rafId: number | null = null
  private lastFrameTime = 0
  private startTime = 0
  private pausedTime = 0
  private frameInterval: number
  private _isPlaying = false

  constructor(
    private readonly onFrame: (time: number) => void,
    fps: number = 60
  ) {
    this.frameInterval = 1000 / fps
    this.startTime = performance.now()
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  play(): void {
    if (this._isPlaying) return
    this._isPlaying = true
    this.startTime = performance.now() - this.pausedTime
    this.tick(performance.now())
  }

  pause(): void {
    if (!this._isPlaying) return
    this._isPlaying = false
    this.pausedTime = performance.now() - this.startTime
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  stop(): void {
    this._isPlaying = false
    this.pausedTime = 0
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  setFps(fps: number): void {
    this.frameInterval = 1000 / fps
  }

  private tick = (now: number): void => {
    if (!this._isPlaying) return
    this.rafId = requestAnimationFrame(this.tick)

    const elapsed = now - this.lastFrameTime
    if (elapsed < this.frameInterval) return

    this.lastFrameTime = now - (elapsed % this.frameInterval)
    const time = (now - this.startTime) / 1000 // seconds
    this.onFrame(time)
  }
}
```

- [ ] **Step 7: Run gradient texture tests**

Run: `cd packages/core && npx vitest run __tests__/gradient-texture.test.ts`
Expected: All 3 tests PASS (vitest uses jsdom which provides `document.createElement('canvas')`)

Note: If canvas is not available in jsdom, add `// @vitest-environment jsdom` at the top of the test file and install `jsdom` as a dev dependency: `pnpm add -D jsdom --filter @rising-company/wave-maker`

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/renderer/ packages/core/__tests__/gradient-texture.test.ts
git commit -m "feat: add WebGL renderer utilities (context, shaders, gradient, animation)"
```

---

### Task 5: WaveMaker Core Class

**Files:**
- Create: `packages/core/src/wave-maker.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/__tests__/options.test.ts`

- [ ] **Step 1: Write options resolution tests**

```typescript
// packages/core/__tests__/options.test.ts
import { describe, it, expect } from 'vitest'
import { resolveOptions } from '../src/wave-maker'

describe('resolveOptions', () => {
  it('uses ocean preset by default', () => {
    const opts = resolveOptions({})
    expect(opts.preset).toBe('ocean')
    expect(opts.colors.length).toBeGreaterThanOrEqual(3)
  })

  it('applies preset defaults', () => {
    const opts = resolveOptions({ preset: 'stitch' })
    expect(opts.valley).toBe(true)
    expect(opts.amplitude).toBe(1.2)
  })

  it('user options override preset defaults', () => {
    const opts = resolveOptions({ preset: 'stitch', valley: false, amplitude: 0.5 })
    expect(opts.valley).toBe(false)
    expect(opts.amplitude).toBe(0.5)
  })

  it('custom colors override preset colors', () => {
    const custom = ['#111111', '#222222', '#333333']
    const opts = resolveOptions({ colors: custom })
    expect(opts.colors).toEqual(custom)
  })

  it('applies global defaults for unset options', () => {
    const opts = resolveOptions({})
    expect(opts.speed).toBe(1.0)
    expect(opts.waveCount).toBe(2)
    expect(opts.blur).toBe(1.0)
    expect(opts.noiseDetail).toBe(4)
    expect(opts.fps).toBe(60)
    expect(opts.animate).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/options.test.ts`
Expected: FAIL — resolveOptions not found

- [ ] **Step 3: Create wave-maker.ts**

```typescript
// packages/core/src/wave-maker.ts
import type { WaveMakerOptions, PresetName } from './types'
import { DEFAULT_OPTIONS } from './types'
import { getPreset } from './presets'
import { createWebGLContext } from './renderer/webgl-context'
import { createProgram } from './renderer/shader-compiler'
import { uploadGradientTexture } from './renderer/gradient-texture'
import { AnimationLoop } from './renderer/animation-loop'
import { vertexShaderSource } from './shaders/vertex'
import { buildFragmentShader } from './shaders/fragment'

export interface ResolvedOptions {
  preset: PresetName
  colors: string[]
  speed: number
  amplitude: number
  waveCount: 1 | 2 | 3
  valley: boolean
  valleyDepth: number
  blur: number
  noiseDetail: number
  fps: number
  pixelRatio: number
  animate: boolean
}

export function resolveOptions(opts: WaveMakerOptions): ResolvedOptions {
  const presetName = opts.preset ?? 'ocean'
  const preset = getPreset(presetName)
  const presetDefaults = preset.defaults ?? {}

  return {
    preset: presetName,
    colors: opts.colors ?? preset.colors,
    speed: opts.speed ?? presetDefaults.speed ?? DEFAULT_OPTIONS.speed,
    amplitude: opts.amplitude ?? presetDefaults.amplitude ?? DEFAULT_OPTIONS.amplitude,
    waveCount: opts.waveCount ?? (presetDefaults.waveCount as 1 | 2 | 3) ?? DEFAULT_OPTIONS.waveCount,
    valley: opts.valley ?? presetDefaults.valley ?? DEFAULT_OPTIONS.valley,
    valleyDepth: opts.valleyDepth ?? presetDefaults.valleyDepth ?? DEFAULT_OPTIONS.valleyDepth,
    blur: opts.blur ?? presetDefaults.blur ?? DEFAULT_OPTIONS.blur,
    noiseDetail: opts.noiseDetail ?? presetDefaults.noiseDetail ?? DEFAULT_OPTIONS.noiseDetail,
    fps: opts.fps ?? presetDefaults.fps ?? DEFAULT_OPTIONS.fps,
    pixelRatio: opts.pixelRatio ?? DEFAULT_OPTIONS.pixelRatio,
    animate: opts.animate ?? presetDefaults.animate ?? DEFAULT_OPTIONS.animate,
  }
}

export class WaveMaker {
  private gl: WebGLRenderingContext | WebGL2RenderingContext
  private program: WebGLProgram
  private gradientTexture: WebGLTexture
  private loop: AnimationLoop
  private resizeObserver: ResizeObserver
  private resolved: ResolvedOptions
  private uniforms: Record<string, WebGLUniformLocation | null> = {}
  private _currentPreset: PresetName | null

  constructor(
    private canvas: HTMLCanvasElement,
    options: WaveMakerOptions = {}
  ) {
    this.resolved = resolveOptions(options)
    this._currentPreset = this.resolved.preset

    // Create WebGL context
    const { gl, isWebGL2 } = createWebGLContext(canvas)
    this.gl = gl

    // Compile shaders
    const fragmentSource = buildFragmentShader(isWebGL2)
    this.program = createProgram(gl, vertexShaderSource, fragmentSource)
    gl.useProgram(this.program)

    // Cache uniform locations
    const uniformNames = [
      'u_time', 'u_resolution', 'u_gradient', 'u_speed', 'u_amplitude',
      'u_valley', 'u_valley_depth', 'u_blur', 'u_wave_count', 'u_noise_detail',
    ]
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name)
    }

    // Setup fullscreen quad
    this.setupQuad()

    // Create and upload gradient texture
    const tex = gl.createTexture()
    if (!tex) throw new Error('Failed to create texture')
    this.gradientTexture = tex
    uploadGradientTexture(gl, this.gradientTexture, this.resolved.colors)

    // Set initial uniforms
    this.updateUniforms()

    // Resize handling
    this.handleResize()
    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(canvas)

    // Animation loop
    this.loop = new AnimationLoop((time) => this.render(time), this.resolved.fps)
    if (this.resolved.animate) {
      this.loop.play()
    }
  }

  get isPlaying(): boolean {
    return this.loop.isPlaying
  }

  get currentPreset(): PresetName | null {
    return this._currentPreset
  }

  play(): void {
    this.loop.play()
  }

  pause(): void {
    this.loop.pause()
  }

  destroy(): void {
    this.loop.stop()
    this.resizeObserver.disconnect()
    const gl = this.gl
    gl.deleteTexture(this.gradientTexture)
    gl.deleteProgram(this.program)
  }

  resize(): void {
    this.handleResize()
  }

  setPreset(name: PresetName): void {
    const preset = getPreset(name)
    this.resolved.colors = preset.colors
    this._currentPreset = name
    if (preset.defaults) {
      Object.assign(this.resolved, preset.defaults)
    }
    uploadGradientTexture(this.gl, this.gradientTexture, this.resolved.colors)
    this.updateUniforms()
  }

  setColors(colors: string[]): void {
    this.resolved.colors = colors
    this._currentPreset = null
    uploadGradientTexture(this.gl, this.gradientTexture, colors)
  }

  setSpeed(speed: number): void {
    this.resolved.speed = speed
    this.gl.useProgram(this.program)
    this.gl.uniform1f(this.uniforms['u_speed']!, speed)
  }

  setAmplitude(amplitude: number): void {
    this.resolved.amplitude = amplitude
    this.gl.useProgram(this.program)
    this.gl.uniform1f(this.uniforms['u_amplitude']!, amplitude)
  }

  // --- Private ---

  private setupQuad(): void {
    const gl = this.gl
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    // Fullscreen triangle pair
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
  }

  private handleResize(): void {
    const ratio = this.resolved.pixelRatio
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    this.canvas.width = width * ratio
    this.canvas.height = height * ratio
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    this.gl.useProgram(this.program)
    this.gl.uniform2f(this.uniforms['u_resolution']!, this.canvas.width, this.canvas.height)
  }

  private updateUniforms(): void {
    const gl = this.gl
    gl.useProgram(this.program)
    gl.uniform1f(this.uniforms['u_speed']!, this.resolved.speed)
    gl.uniform1f(this.uniforms['u_amplitude']!, this.resolved.amplitude)
    gl.uniform1f(this.uniforms['u_valley']!, this.resolved.valley ? 1.0 : 0.0)
    gl.uniform1f(this.uniforms['u_valley_depth']!, this.resolved.valleyDepth)
    gl.uniform1f(this.uniforms['u_blur']!, this.resolved.blur)
    gl.uniform1f(this.uniforms['u_wave_count']!, this.resolved.waveCount)
    gl.uniform1f(this.uniforms['u_noise_detail']!, this.resolved.noiseDetail)

    // Bind gradient texture to unit 0
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture)
    gl.uniform1i(this.uniforms['u_gradient']!, 0)
  }

  private render(time: number): void {
    const gl = this.gl
    gl.useProgram(this.program)
    gl.uniform1f(this.uniforms['u_time']!, time)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/index.ts
export { WaveMaker } from './wave-maker'
export type { WaveMakerOptions, Preset, PresetName } from './types'
export { getPreset, presetNames } from './presets'
```

- [ ] **Step 5: Run all tests**

Run: `cd packages/core && npx vitest run`
Expected: All tests PASS (presets, gradient-texture, options)

- [ ] **Step 6: Build the core package**

Run: `cd packages/core && npx tsup`
Expected: Builds ESM + CJS to `dist/` with `.d.ts` files, no errors

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/wave-maker.ts packages/core/src/index.ts packages/core/__tests__/options.test.ts
git commit -m "feat: implement WaveMaker core class with WebGL rendering"
```

---

### Task 6: React Wrapper

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/tsup.config.ts`
- Create: `packages/react/src/WaveMaker.tsx`, `packages/react/src/index.ts`

- [ ] **Step 1: Create react package.json**

```json
{
  "name": "@rising-company/wave-maker-react",
  "version": "0.1.0",
  "description": "React component for wave-maker WebGL gradients",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "license": "MIT",
  "peerDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create react tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create react tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', '@rising-company/wave-maker'],
})
```

- [ ] **Step 4: Create WaveMaker.tsx**

```tsx
// packages/react/src/WaveMaker.tsx
import { useRef, useEffect, type CSSProperties } from 'react'
import {
  WaveMaker as WaveMakerCore,
  type WaveMakerOptions,
  type PresetName,
} from '@rising-company/wave-maker'

export interface WaveMakerProps extends WaveMakerOptions {
  className?: string
  style?: CSSProperties
  id?: string
}

export function WaveMaker({
  className,
  style,
  id,
  preset,
  colors,
  speed,
  amplitude,
  waveCount,
  valley,
  valleyDepth,
  blur,
  noiseDetail,
  fps,
  pixelRatio,
  animate,
}: WaveMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<WaveMakerCore | null>(null)

  // Create instance on mount, destroy on unmount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const instance = new WaveMakerCore(canvas, {
      preset, colors, speed, amplitude, waveCount,
      valley, valleyDepth, blur, noiseDetail, fps, pixelRatio, animate,
    })
    instanceRef.current = instance

    return () => {
      instance.destroy()
      instanceRef.current = null
    }
    // Only re-create on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update preset
  useEffect(() => {
    if (instanceRef.current && preset !== undefined) {
      instanceRef.current.setPreset(preset)
    }
  }, [preset])

  // Update colors
  useEffect(() => {
    if (instanceRef.current && colors !== undefined) {
      instanceRef.current.setColors(colors)
    }
  }, [colors])

  // Update speed
  useEffect(() => {
    if (instanceRef.current && speed !== undefined) {
      instanceRef.current.setSpeed(speed)
    }
  }, [speed])

  // Update amplitude
  useEffect(() => {
    if (instanceRef.current && amplitude !== undefined) {
      instanceRef.current.setAmplitude(amplitude)
    }
  }, [amplitude])

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }

  const canvasStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'block',
  }

  return (
    <div className={className} style={wrapperStyle} id={id}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  )
}
```

- [ ] **Step 5: Create index.ts**

```typescript
// packages/react/src/index.ts
export { WaveMaker, type WaveMakerProps } from './WaveMaker'
export type { WaveMakerOptions, PresetName, Preset } from '@rising-company/wave-maker'
```

- [ ] **Step 6: Install deps and build**

Run: `pnpm install && cd packages/react && npx tsup`
Expected: Builds without errors

- [ ] **Step 7: Commit**

```bash
git add packages/react/
git commit -m "feat: add React wrapper component"
```

---

### Task 7: Vue Wrapper

**Files:**
- Create: `packages/vue/package.json`, `packages/vue/tsconfig.json`, `packages/vue/tsup.config.ts`
- Create: `packages/vue/src/WaveMaker.vue`, `packages/vue/src/index.ts`

- [ ] **Step 1: Create vue package.json**

```json
{
  "name": "@rising-company/wave-maker-vue",
  "version": "0.1.0",
  "description": "Vue component for wave-maker WebGL gradients",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "license": "MIT",
  "peerDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "vue": "^3.5.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create vue tsconfig.json and tsup.config.ts**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "preserve"
  },
  "include": ["src"]
}
```

```typescript
// packages/vue/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['vue', '@rising-company/wave-maker'],
})
```

- [ ] **Step 3: Create WaveMaker.vue**

```vue
<!-- packages/vue/src/WaveMaker.vue -->
<template>
  <div :class="$attrs.class" :style="wrapperStyle" :id="($attrs.id as string)">
    <canvas ref="canvasRef" :style="canvasStyle" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, type CSSProperties } from 'vue'
import {
  WaveMaker as WaveMakerCore,
  type WaveMakerOptions,
  type PresetName,
} from '@rising-company/wave-maker'

const props = withDefaults(defineProps<WaveMakerOptions>(), {
  preset: 'ocean',
  speed: 1.0,
  amplitude: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  blur: 1.0,
  noiseDetail: 4,
  fps: 60,
  animate: true,
})

defineOptions({ inheritAttrs: false })

const canvasRef = ref<HTMLCanvasElement | null>(null)
let instance: WaveMakerCore | null = null

const wrapperStyle = computed<CSSProperties>(() => ({
  position: 'relative',
  overflow: 'hidden',
}))

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  display: 'block',
}

onMounted(() => {
  if (!canvasRef.value) return
  instance = new WaveMakerCore(canvasRef.value, { ...props })
})

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})

watch(() => props.preset, (name) => { if (instance && name) instance.setPreset(name) })
watch(() => props.colors, (c) => { if (instance && c) instance.setColors(c) })
watch(() => props.speed, (v) => { if (instance && v !== undefined) instance.setSpeed(v) })
watch(() => props.amplitude, (v) => { if (instance && v !== undefined) instance.setAmplitude(v) })
</script>
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/vue/src/index.ts
export { default as WaveMaker } from './WaveMaker.vue'
export type { WaveMakerOptions, PresetName, Preset } from '@rising-company/wave-maker'
```

- [ ] **Step 5: Install deps and build**

Run: `pnpm install && cd packages/vue && npx tsup`
Expected: Builds without errors

- [ ] **Step 6: Commit**

```bash
git add packages/vue/
git commit -m "feat: add Vue wrapper component"
```

---

### Task 8: Svelte Wrapper

**Files:**
- Create: `packages/svelte/package.json`, `packages/svelte/tsconfig.json`, `packages/svelte/tsup.config.ts`
- Create: `packages/svelte/src/WaveMaker.svelte`, `packages/svelte/src/index.ts`

- [ ] **Step 1: Create svelte package.json**

```json
{
  "name": "@rising-company/wave-maker-svelte",
  "version": "0.1.0",
  "description": "Svelte component for wave-maker WebGL gradients",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "svelte": "./dist/index.js",
  "exports": {
    ".": {
      "svelte": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "license": "MIT",
  "peerDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@rising-company/wave-maker": "workspace:*",
    "svelte": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create svelte tsconfig.json and tsup.config.ts**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

```typescript
// packages/svelte/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['svelte', '@rising-company/wave-maker'],
})
```

- [ ] **Step 3: Create WaveMaker.svelte**

```svelte
<!-- packages/svelte/src/WaveMaker.svelte -->
<script lang="ts">
  import {
    WaveMaker as WaveMakerCore,
    type WaveMakerOptions,
    type PresetName,
  } from '@rising-company/wave-maker'

  let {
    preset = 'ocean',
    colors,
    speed = 1.0,
    amplitude = 1.0,
    waveCount = 2,
    valley = false,
    valleyDepth = 0.32,
    blur = 1.0,
    noiseDetail = 4,
    fps = 60,
    pixelRatio,
    animate = true,
    class: className = '',
    ...restProps
  }: WaveMakerOptions & { class?: string; [key: string]: any } = $props()

  let canvasEl: HTMLCanvasElement
  let instance: WaveMakerCore | null = null

  $effect(() => {
    instance = new WaveMakerCore(canvasEl, {
      preset: preset as PresetName, colors, speed, amplitude,
      waveCount: waveCount as 1 | 2 | 3,
      valley, valleyDepth, blur, noiseDetail, fps, pixelRatio, animate,
    })
    return () => {
      instance?.destroy()
      instance = null
    }
  })

  $effect(() => { if (instance && preset) instance.setPreset(preset as PresetName) })
  $effect(() => { if (instance && colors) instance.setColors(colors) })
  $effect(() => { if (instance) instance.setSpeed(speed) })
  $effect(() => { if (instance) instance.setAmplitude(amplitude) })
</script>

<div
  class={className}
  style="position: relative; overflow: hidden;"
  {...restProps}
>
  <canvas
    bind:this={canvasEl}
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;"
  />
</div>
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/svelte/src/index.ts
export { default as WaveMaker } from './WaveMaker.svelte'
export type { WaveMakerOptions, PresetName, Preset } from '@rising-company/wave-maker'
```

- [ ] **Step 5: Install deps and build**

Run: `pnpm install && cd packages/svelte && npx tsup`
Expected: Builds without errors (Svelte files may need `svelte` plugin — if tsup fails on `.svelte` imports, the index.ts re-export approach should work since tsup treats the `.svelte` file as external or we add `svelte-package` as the build tool instead. Adjust if needed — see note below.)

Note: If tsup can't handle `.svelte` file re-exports, switch the Svelte package to use `svelte-package` from `@sveltejs/package` instead of tsup. Update `package.json` scripts to `"build": "svelte-package"` and add `@sveltejs/package` as a dev dependency.

- [ ] **Step 6: Commit**

```bash
git add packages/svelte/
git commit -m "feat: add Svelte wrapper component"
```

---

### Task 9: Demo Site — Structure, Hero & Showcases

**Files:**
- Create: `demo/package.json`, `demo/tsconfig.json`, `demo/vite.config.ts`
- Create: `demo/index.html`, `demo/src/main.ts`, `demo/src/style.css`
- Create: `demo/src/sections/hero.ts`, `demo/src/sections/showcase.ts`

- [ ] **Step 1: Create demo package.json**

```json
{
  "name": "wave-maker-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@rising-company/wave-maker": "workspace:*"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create demo vite.config.ts and tsconfig.json**

```typescript
// demo/vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
})
```

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create index.html**

```html
<!-- demo/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>wave-maker — Beautiful WebGL Wave Gradients</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Create style.css**

```css
/* demo/src/style.css */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #e2e8f0;
  line-height: 1.6;
}

.section {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 15px;
  color: #94a3b8;
  margin-bottom: 24px;
}

/* Hero */
.hero {
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 12px;
}

.hero-subtitle {
  font-size: 20px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.hero-install {
  display: inline-block;
  font-family: monospace;
  font-size: 14px;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

/* Showcase */
.showcase-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
}

.showcase-canvas-wrapper canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.showcase-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  text-align: center;
}

.showcase-overlay h3 {
  font-size: 32px;
  font-weight: 700;
}

.showcase-overlay p {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 4px;
}
```

- [ ] **Step 5: Create hero.ts**

```typescript
// demo/src/sections/hero.ts
import { WaveMaker } from '@rising-company/wave-maker'

export function createHero(container: HTMLElement): void {
  container.innerHTML = `
    <section class="hero">
      <canvas id="hero-canvas"></canvas>
      <div class="hero-content">
        <h1 class="hero-title">wave-maker</h1>
        <p class="hero-subtitle">Beautiful WebGL wave gradients for the web</p>
        <code class="hero-install">npm i @rising-company/wave-maker</code>
      </div>
    </section>
  `

  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement
  new WaveMaker(canvas, {
    preset: 'stitch',
    valley: true,
    speed: 0.6,
  })
}
```

- [ ] **Step 6: Create showcase.ts**

```typescript
// demo/src/sections/showcase.ts
import { WaveMaker } from '@rising-company/wave-maker'

export function createShowcases(container: HTMLElement): void {
  container.innerHTML = `
    <section class="section">
      <span class="section-label" style="background: rgba(99,102,241,0.2); color: #a5b4fc;">PRESET</span>
      <h2 class="section-title">Stitch Style</h2>
      <p class="section-desc">Valley geometry with dramatic sea-wave crests — inspired by Google Stitch</p>
      <div class="showcase-canvas-wrapper">
        <canvas id="showcase-stitch"></canvas>
        <div class="showcase-overlay">
          <div>
            <h3>Your Title Here</h3>
            <p>Content sits in the valley</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <span class="section-label" style="background: rgba(14,165,233,0.2); color: #7dd3fc;">PRESET</span>
      <h2 class="section-title">Alex Harri Style</h2>
      <p class="section-desc">Flowing horizontal waves with gradient color mapping and soft blur edges</p>
      <div class="showcase-canvas-wrapper">
        <canvas id="showcase-harri"></canvas>
      </div>
    </section>
  `

  const stitchCanvas = document.getElementById('showcase-stitch') as HTMLCanvasElement
  new WaveMaker(stitchCanvas, {
    preset: 'stitch',
    valley: true,
    valleyDepth: 0.35,
    amplitude: 1.2,
    speed: 0.8,
  })

  const harriCanvas = document.getElementById('showcase-harri') as HTMLCanvasElement
  new WaveMaker(harriCanvas, {
    preset: 'ocean',
    valley: false,
    waveCount: 2,
    speed: 1.0,
  })
}
```

- [ ] **Step 7: Create main.ts**

```typescript
// demo/src/main.ts
import { createHero } from './sections/hero'
import { createShowcases } from './sections/showcase'

const app = document.getElementById('app')!

const heroContainer = document.createElement('div')
const showcaseContainer = document.createElement('div')

app.appendChild(heroContainer)
app.appendChild(showcaseContainer)

createHero(heroContainer)
createShowcases(showcaseContainer)
```

- [ ] **Step 8: Install deps, start dev server, verify hero + showcases render**

Run: `pnpm install && cd demo && npx vite`
Expected: Dev server starts. Open in browser — hero section shows wave-maker with stitch preset, two showcase sections render below it.

- [ ] **Step 9: Commit**

```bash
git add demo/
git commit -m "feat: add demo site with hero and preset showcases"
```

---

### Task 10: Demo Site — Playground

**Files:**
- Create: `demo/src/sections/playground.ts`
- Modify: `demo/src/main.ts`

- [ ] **Step 1: Create playground.ts**

```typescript
// demo/src/sections/playground.ts
import { WaveMaker, presetNames, type PresetName } from '@rising-company/wave-maker'

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

const state: PlaygroundState = {
  preset: 'ocean',
  speed: 1.0,
  amplitude: 1.0,
  blur: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  noiseDetail: 4,
}

function generateCode(framework: string, s: PlaygroundState): string {
  const props = [
    `preset="${s.preset}"`,
    s.valley ? 'valley' : '',
    s.speed !== 1.0 ? `speed={${s.speed}}` : '',
    s.amplitude !== 1.0 ? `amplitude={${s.amplitude}}` : '',
    s.blur !== 1.0 ? `blur={${s.blur}}` : '',
    s.waveCount !== 2 ? `waveCount={${s.waveCount}}` : '',
    s.valley && s.valleyDepth !== 0.32 ? `valleyDepth={${s.valleyDepth}}` : '',
    s.noiseDetail !== 4 ? `noiseDetail={${s.noiseDetail}}` : '',
  ].filter(Boolean).join('\n    ')

  switch (framework) {
    case 'react':
      return `import { WaveMaker } from '@rising-company/wave-maker-react'

function Hero() {
  return (
    <WaveMaker
    ${props}
      className="absolute inset-0"
    />
  )
}`
    case 'vue':
      return `<template>
  <WaveMaker
    ${props.replace(/\{(\d+\.?\d*)\}/g, '"$1"').replace(/={true}/g, '')}
    class="absolute inset-0"
  />
</template>

<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>`
    case 'svelte':
      return `<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<WaveMaker
  ${props}
  class="absolute inset-0"
/>`
    case 'vanilla':
    default:
      const opts = [
        `preset: '${s.preset}'`,
        s.valley ? `valley: true` : '',
        s.speed !== 1.0 ? `speed: ${s.speed}` : '',
        s.amplitude !== 1.0 ? `amplitude: ${s.amplitude}` : '',
        s.blur !== 1.0 ? `blur: ${s.blur}` : '',
        s.waveCount !== 2 ? `waveCount: ${s.waveCount}` : '',
        s.valley && s.valleyDepth !== 0.32 ? `valleyDepth: ${s.valleyDepth}` : '',
        s.noiseDetail !== 4 ? `noiseDetail: ${s.noiseDetail}` : '',
      ].filter(Boolean).join(',\n  ')

      return `import { WaveMaker } from '@rising-company/wave-maker'

const canvas = document.querySelector('canvas')
const wave = new WaveMaker(canvas, {
  ${opts},
})`
  }
}

export function createPlayground(container: HTMLElement): void {
  let instance: WaveMaker | null = null
  let currentFramework = 'react'

  function render(): void {
    container.innerHTML = `
      <section class="section">
        <span class="section-label" style="background: rgba(245,158,11,0.2); color: #fbbf24;">PLAYGROUND</span>
        <h2 class="section-title">Build Your Own</h2>
        <p class="section-desc">Tune parameters, preview live, copy code for your framework</p>

        <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; margin-bottom: 20px;">
          <div class="showcase-canvas-wrapper" style="height: 360px;">
            <canvas id="playground-canvas"></canvas>
          </div>

          <div style="background: rgba(148,163,184,0.05); border: 1px solid rgba(148,163,184,0.12); border-radius: 12px; padding: 20px; font-size: 13px;">
            <div style="color: #94a3b8; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 16px;">Controls</div>

            <div style="margin-bottom: 14px;">
              <div style="color: #cbd5e1; margin-bottom: 6px;">Preset</div>
              <div id="preset-btns" style="display: flex; gap: 4px; flex-wrap: wrap;"></div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;"><span>Speed</span><span id="speed-val">${state.speed}</span></div>
              <input type="range" id="speed" min="0" max="3" step="0.1" value="${state.speed}" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;"><span>Amplitude</span><span id="amp-val">${state.amplitude}</span></div>
              <input type="range" id="amplitude" min="0" max="3" step="0.1" value="${state.amplitude}" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;"><span>Blur</span><span id="blur-val">${state.blur}</span></div>
              <input type="range" id="blur" min="0" max="3" step="0.1" value="${state.blur}" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;"><span>Noise Detail</span><span id="noise-val">${state.noiseDetail}</span></div>
              <input type="range" id="noiseDetail" min="1" max="6" step="1" value="${state.noiseDetail}" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 12px;">
              <div style="color: #cbd5e1; margin-bottom: 6px;">Wave Count</div>
              <div id="wave-btns" style="display: flex; gap: 4px;"></div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="color: #cbd5e1; margin-bottom: 6px;">Valley</div>
              <div id="valley-btns" style="display: flex; gap: 4px;"></div>
            </div>

            <div id="valley-depth-row" style="margin-bottom: 12px; display: ${state.valley ? 'block' : 'none'};">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;"><span>Valley Depth</span><span id="vd-val">${state.valleyDepth}</span></div>
              <input type="range" id="valleyDepth" min="0" max="1" step="0.01" value="${state.valleyDepth}" style="width: 100%;" />
            </div>
          </div>
        </div>

        <!-- Code output -->
        <div>
          <div id="fw-tabs" style="display: flex; gap: 1px; margin-bottom: -1px;"></div>
          <div style="background: #0f172a; border: 1px solid rgba(148,163,184,0.12); border-radius: 0 8px 8px 8px; padding: 20px; position: relative;">
            <button id="copy-btn" style="position: absolute; top: 10px; right: 14px; background: rgba(99,102,241,0.2); color: #a5b4fc; border: none; padding: 4px 14px; border-radius: 4px; font-size: 11px; cursor: pointer;">Copy</button>
            <pre id="code-output" style="font-family: monospace; font-size: 13px; line-height: 1.7; color: #cbd5e1; white-space: pre-wrap; margin: 0;"></pre>
          </div>
        </div>
      </section>
    `

    // --- Wire up controls ---
    const canvas = document.getElementById('playground-canvas') as HTMLCanvasElement
    instance?.destroy()
    instance = new WaveMaker(canvas, { ...state })

    // Preset buttons
    const presetBtns = document.getElementById('preset-btns')!
    for (const name of presetNames) {
      const btn = document.createElement('button')
      btn.textContent = name
      btn.style.cssText = `padding: 3px 10px; border-radius: 4px; border: none; font-size: 11px; cursor: pointer; ${
        name === state.preset
          ? 'background: #6366f1; color: white;'
          : 'background: rgba(148,163,184,0.15); color: #94a3b8;'
      }`
      btn.onclick = () => {
        state.preset = name as PresetName
        instance?.setPreset(name as PresetName)
        render()
      }
      presetBtns.appendChild(btn)
    }

    // Wave count buttons
    const waveBtns = document.getElementById('wave-btns')!
    for (const n of [1, 2, 3] as const) {
      const btn = document.createElement('button')
      btn.textContent = String(n)
      btn.style.cssText = `padding: 3px 12px; border-radius: 4px; border: none; font-size: 11px; cursor: pointer; ${
        n === state.waveCount
          ? 'background: #6366f1; color: white;'
          : 'background: rgba(148,163,184,0.15); color: #94a3b8;'
      }`
      btn.onclick = () => {
        state.waveCount = n
        instance?.destroy()
        instance = new WaveMaker(canvas, { ...state })
        render()
      }
      waveBtns.appendChild(btn)
    }

    // Valley buttons
    const valleyBtns = document.getElementById('valley-btns')!
    for (const v of [true, false]) {
      const btn = document.createElement('button')
      btn.textContent = v ? 'On' : 'Off'
      btn.style.cssText = `padding: 3px 12px; border-radius: 4px; border: none; font-size: 11px; cursor: pointer; ${
        v === state.valley
          ? 'background: #6366f1; color: white;'
          : 'background: rgba(148,163,184,0.15); color: #94a3b8;'
      }`
      btn.onclick = () => {
        state.valley = v
        instance?.destroy()
        instance = new WaveMaker(canvas, { ...state })
        render()
      }
      valleyBtns.appendChild(btn)
    }

    // Sliders
    const sliderConfig: Array<{ id: string; key: keyof PlaygroundState; valId: string; dynamic: boolean }> = [
      { id: 'speed', key: 'speed', valId: 'speed-val', dynamic: true },
      { id: 'amplitude', key: 'amplitude', valId: 'amp-val', dynamic: true },
      { id: 'blur', key: 'blur', valId: 'blur-val', dynamic: false },
      { id: 'noiseDetail', key: 'noiseDetail', valId: 'noise-val', dynamic: false },
      { id: 'valleyDepth', key: 'valleyDepth', valId: 'vd-val', dynamic: false },
    ]
    for (const { id, key, valId, dynamic } of sliderConfig) {
      const slider = document.getElementById(id) as HTMLInputElement | null
      if (!slider) continue
      slider.oninput = () => {
        const val = parseFloat(slider.value)
        ;(state as any)[key] = key === 'noiseDetail' ? Math.round(val) : val
        const valEl = document.getElementById(valId)
        if (valEl) valEl.textContent = String((state as any)[key])
        if (dynamic && instance) {
          if (key === 'speed') instance.setSpeed(val)
          if (key === 'amplitude') instance.setAmplitude(val)
        } else {
          // Recreate for non-dynamic uniforms
          instance?.destroy()
          instance = new WaveMaker(canvas, { ...state })
        }
        updateCode()
      }
    }

    // Framework tabs
    const fwTabs = document.getElementById('fw-tabs')!
    for (const fw of ['react', 'vue', 'svelte', 'vanilla']) {
      const tab = document.createElement('button')
      tab.textContent = fw.charAt(0).toUpperCase() + fw.slice(1)
      tab.style.cssText = `padding: 8px 18px; border: none; border-radius: 8px 8px 0 0; font-size: 12px; font-weight: 600; cursor: pointer; ${
        fw === currentFramework
          ? 'background: rgba(99,102,241,0.2); color: #a5b4fc;'
          : 'background: rgba(148,163,184,0.08); color: #64748b;'
      }`
      tab.onclick = () => {
        currentFramework = fw
        render()
      }
      fwTabs.appendChild(tab)
    }

    // Copy button
    document.getElementById('copy-btn')!.onclick = () => {
      const code = document.getElementById('code-output')!.textContent!
      navigator.clipboard.writeText(code)
      const btn = document.getElementById('copy-btn')!
      btn.textContent = 'Copied!'
      setTimeout(() => { btn.textContent = 'Copy' }, 1500)
    }

    updateCode()
  }

  function updateCode(): void {
    const output = document.getElementById('code-output')
    if (output) output.textContent = generateCode(currentFramework, state)
  }

  render()
}
```

- [ ] **Step 2: Update main.ts to include playground**

```typescript
// demo/src/main.ts
import { createHero } from './sections/hero'
import { createShowcases } from './sections/showcase'
import { createPlayground } from './sections/playground'

const app = document.getElementById('app')!

const heroContainer = document.createElement('div')
const showcaseContainer = document.createElement('div')
const playgroundContainer = document.createElement('div')

app.appendChild(heroContainer)
app.appendChild(showcaseContainer)
app.appendChild(playgroundContainer)

createHero(heroContainer)
createShowcases(showcaseContainer)
createPlayground(playgroundContainer)
```

- [ ] **Step 3: Start dev server and verify playground works**

Run: `cd demo && npx vite`
Expected: Playground renders with live canvas, preset buttons, sliders, wave/valley toggles, framework tabs with generated code, and copy button.

- [ ] **Step 4: Commit**

```bash
git add demo/src/sections/playground.ts demo/src/main.ts
git commit -m "feat: add interactive playground with code generation"
```

---

### Task 11: LLMs Support, README, and LICENSE

**Files:**
- Create: `llms.txt`, `llms-full.txt`, `README.md`, `LICENSE`

- [ ] **Step 1: Create llms.txt**

```text
# wave-maker

> Beautiful animated WebGL wave gradient effects for the web.

## Installation

Core (vanilla JS):
npm install @rising-company/wave-maker

React:
npm install @rising-company/wave-maker-react @rising-company/wave-maker

Vue:
npm install @rising-company/wave-maker-vue @rising-company/wave-maker

Svelte:
npm install @rising-company/wave-maker-svelte @rising-company/wave-maker

## Quick Start

### Vanilla JS
```js
import { WaveMaker } from '@rising-company/wave-maker'
const wave = new WaveMaker(document.querySelector('canvas'), {
  preset: 'ocean',
})
```

### React
```jsx
import { WaveMaker } from '@rising-company/wave-maker-react'
<WaveMaker preset="ocean" className="absolute inset-0" />
```

### Vue
```vue
<WaveMaker preset="ocean" class="absolute inset-0" />
```

### Svelte
```svelte
<WaveMaker preset="ocean" class="absolute inset-0" />
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| preset | 'ocean'\|'sunset'\|'aurora'\|'stitch'\|'midnight'\|'ember' | 'ocean' | Color theme |
| colors | string[] | from preset | Custom gradient colors (3-6 hex values) |
| speed | number | 1.0 | Animation speed (0 = frozen) |
| amplitude | number | 1.0 | Wave height multiplier |
| waveCount | 1\|2\|3 | 2 | Number of wave layers |
| valley | boolean | false | Center valley for overlaying content |
| valleyDepth | number | 0.32 | Valley depth (0-1) |
| blur | number | 1.0 | Edge blur intensity |
| noiseDetail | number | 4 | Noise octaves (1-6) |
| fps | number | 60 | Frame rate cap |
| pixelRatio | number | devicePixelRatio | Rendering resolution |
| animate | boolean | true | Auto-start |

## Methods

wave.play() — resume
wave.pause() — pause
wave.destroy() — cleanup
wave.resize() — manual resize
wave.setPreset(name) — switch preset
wave.setColors(colors) — set custom colors
wave.setSpeed(n) — update speed
wave.setAmplitude(n) — update amplitude

## Properties

wave.isPlaying — boolean
wave.currentPreset — PresetName | null

## Presets

- ocean: Deep blues, teals, seafoam
- sunset: Oranges, purples, pinks
- aurora: Greens, cyans, magentas
- stitch: Purple/indigo + amber/cream (valley enabled by default)
- midnight: Dark blues, silver, slate
- ember: Reds, golds, deep black

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
<WaveMaker
  preset="ocean"
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>
```
```

- [ ] **Step 2: Create llms-full.txt**

Same as `llms.txt` plus these additional sections appended:

```text
## Preset Color Values

- ocean: ['#0a2342', '#1a5276', '#2e86c1', '#48c9b0', '#76d7c4', '#d4efdf']
- sunset: ['#2c0e37', '#6c3483', '#e74c3c', '#f39c12', '#f5b041', '#fad7a0']
- aurora: ['#0b0c10', '#1a472a', '#2ecc71', '#1abc9c', '#5dade2', '#af7ac5']
- stitch: ['#1a0533', '#4a0e8f', '#6b3fa0', '#c9a87c', '#d4a574', '#f5e6d3']
- midnight: ['#0a0e27', '#1a1f4e', '#2c3e7a', '#7f8c9b', '#b0bec5', '#cfd8dc']
- ember: ['#1a0000', '#4a0000', '#c0392b', '#e67e22', '#f1c40f', '#fde68a']

## Shader Uniforms

The core uses a WebGL fragment shader with these uniforms:
- u_time (float) — elapsed seconds, updated every frame
- u_resolution (vec2) — canvas width/height in pixels
- u_gradient (sampler2D) — 1x256 gradient texture
- u_speed (float) — speed multiplier
- u_amplitude (float) — wave height multiplier
- u_valley (float) — 0.0 or 1.0
- u_valley_depth (float) — valley dip amount
- u_blur (float) — blur intensity
- u_wave_count (float) — 1.0, 2.0, or 3.0
- u_noise_detail (float) — noise octaves 1-6

## Technical Notes

- Uses simplex noise (2D + 3D) from Ashima Arts / stegu (MIT license)
- Gradient colors are baked into a 1x256 pixel canvas texture
- WebGL 2.0 preferred with WebGL 1.0 fallback
- Core bundle ~8-12 KB gzipped
- ResizeObserver for automatic responsive behavior
```

- [ ] **Step 3: Create README.md**

```markdown
# wave-maker

Beautiful animated WebGL wave gradient effects for the web.

Inspired by [Alex Harri's "A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) and [Google Stitch](https://stitch.withgoogle.com/).

## Installation

```bash
# Core (vanilla JS)
npm install @rising-company/wave-maker

# React
npm install @rising-company/wave-maker-react @rising-company/wave-maker

# Vue
npm install @rising-company/wave-maker-vue @rising-company/wave-maker

# Svelte
npm install @rising-company/wave-maker-svelte @rising-company/wave-maker
```

## Quick Start

### Vanilla JS

```javascript
import { WaveMaker } from '@rising-company/wave-maker'

const canvas = document.querySelector('canvas')
const wave = new WaveMaker(canvas, {
  preset: 'ocean',
})
```

### React

```jsx
import { WaveMaker } from '@rising-company/wave-maker-react'

function Hero() {
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <WaveMaker preset="stitch" valley className="absolute inset-0" />
      <h1 style={{ position: 'relative', zIndex: 1 }}>Hello</h1>
    </div>
  )
}
```

### Vue

```vue
<template>
  <WaveMaker preset="ocean" valley :speed="0.8" class="absolute inset-0" />
</template>

<script setup>
import { WaveMaker } from '@rising-company/wave-maker-vue'
</script>
```

### Svelte

```svelte
<script>
  import { WaveMaker } from '@rising-company/wave-maker-svelte'
</script>

<WaveMaker preset="aurora" valley speed={1.2} class="absolute inset-0" />
```

## Presets

| Name | Description |
|------|-------------|
| `ocean` | Deep blues, teals, seafoam (default) |
| `sunset` | Oranges, purples, pinks |
| `aurora` | Greens, cyans, magentas |
| `stitch` | Purple/indigo + amber/cream |
| `midnight` | Dark blues, silver, slate |
| `ember` | Reds, golds, deep black |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | `PresetName` | `'ocean'` | Color theme |
| `colors` | `string[]` | from preset | Custom gradient colors (3-6 hex) |
| `speed` | `number` | `1.0` | Animation speed (0 = frozen) |
| `amplitude` | `number` | `1.0` | Wave height multiplier |
| `waveCount` | `1 \| 2 \| 3` | `2` | Number of wave layers |
| `valley` | `boolean` | `false` | Center valley for content |
| `valleyDepth` | `number` | `0.32` | Valley depth (0-1) |
| `blur` | `number` | `1.0` | Edge blur intensity |
| `noiseDetail` | `number` | `4` | Noise octaves (1-6) |
| `fps` | `number` | `60` | Frame rate cap |
| `animate` | `boolean` | `true` | Auto-start |

## API

```typescript
const wave = new WaveMaker(canvas, options)

wave.play()
wave.pause()
wave.destroy()
wave.resize()
wave.setPreset('sunset')
wave.setColors(['#ff6b6b', '#4ecdc4', '#45b7d1'])
wave.setSpeed(0.5)
wave.setAmplitude(1.5)

wave.isPlaying      // boolean
wave.currentPreset  // PresetName | null
```

## Acknowledgements

- **[Alex Harri](https://alexharri.com)** — Wave gradient technique and the blog post ["A flowing WebGL gradient, deconstructed"](https://alexharri.com/blog/webgl-gradients) that inspired this library.
- **Ian McEwan, Ashima Arts & [Stefan Gustavson (stegu)](https://github.com/stegu/webgl-noise)** — Simplex noise GLSL implementation (MIT License).
- **[Google Stitch](https://stitch.withgoogle.com/)** — Visual inspiration for valley geometry and dramatic wave styling.

## License

MIT
```

- [ ] **Step 4: Create LICENSE**

```text
MIT License

Copyright (c) 2026 Rising Company

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Commit**

```bash
git add llms.txt llms-full.txt README.md LICENSE
git commit -m "docs: add README, LICENSE, and LLM support files"
```

---

### Task 12: Final Integration & Visual Verification

**Files:**
- None new — this is a build + verify task

- [ ] **Step 1: Build all packages**

Run: `pnpm -r build`
Expected: All packages build without errors

- [ ] **Step 2: Run all tests**

Run: `pnpm -r test`
Expected: All tests pass

- [ ] **Step 3: Start demo and visually verify**

Run: `cd demo && npx vite`
Expected:
- Hero renders with stitch preset + valley
- Stitch showcase shows dramatic valley waves
- Alex Harri showcase shows flowing horizontal waves
- Playground: presets switch correctly, sliders update live, code output matches parameters, copy works, framework tabs switch code

- [ ] **Step 4: Fix any visual issues with shader parameters**

The shader values (noise scales, wave positions, blur amounts) may need tuning based on visual output. Adjust constants in `packages/core/src/shaders/fragment.ts` until the effect looks polished. Key things to check:
- Wave motion feels organic, not repetitive
- Blur edges are soft and irregular
- Valley geometry creates a clear center calm zone
- Color gradients are smooth, no banding

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final build and shader tuning"
```
