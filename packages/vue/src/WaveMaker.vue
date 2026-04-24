<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, useAttrs } from 'vue'
import {
  WaveMaker as WaveMakerCore,
  type WaveMakerOptions,
  type PresetName,
} from '@rising-company/wave-maker'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    preset?: PresetName
    colors?: string[]
    speed?: number
    amplitude?: number
    waveCount?: 1 | 2 | 3
    valley?: boolean
    valleyDepth?: number
    blur?: number
    noiseDetail?: number
    fps?: number
    pixelRatio?: number
    animate?: boolean
  }>(),
  {
    preset: 'ocean',
    colors: undefined,
    speed: 1.0,
    amplitude: 1.0,
    waveCount: 2,
    valley: false,
    valleyDepth: 0.32,
    blur: 1.0,
    noiseDetail: 4,
    fps: 60,
    pixelRatio: undefined,
    animate: true,
  }
)

const attrs = useAttrs()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let instance: WaveMakerCore | null = null

onMounted(() => {
  if (!canvasRef.value) return

  instance = new WaveMakerCore(canvasRef.value, {
    preset: props.preset,
    colors: props.colors,
    speed: props.speed,
    amplitude: props.amplitude,
    waveCount: props.waveCount,
    valley: props.valley,
    valleyDepth: props.valleyDepth,
    blur: props.blur,
    noiseDetail: props.noiseDetail,
    fps: props.fps,
    pixelRatio: props.pixelRatio,
    animate: props.animate,
  })
})

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})

watch(
  () => props.preset,
  (newPreset) => {
    if (instance && newPreset) {
      instance.setPreset(newPreset)
    }
  }
)

watch(
  () => props.colors,
  (newColors) => {
    if (instance && newColors) {
      instance.setColors(newColors)
    }
  }
)

watch(
  () => props.speed,
  (newSpeed) => {
    if (instance) {
      instance.setSpeed(newSpeed)
    }
  }
)

watch(
  () => props.amplitude,
  (newAmplitude) => {
    if (instance) {
      instance.setAmplitude(newAmplitude)
    }
  }
)
</script>

<template>
  <div
    :class="(attrs.class as string)"
    :id="(attrs.id as string)"
    :style="{ position: 'relative', overflow: 'hidden', ...(attrs.style as any) }"
  >
    <canvas
      ref="canvasRef"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;"
    />
  </div>
</template>
