<script lang="ts">
  import { WaveMaker as WaveMakerCore, type WaveMakerOptions, type PresetName } from '@rising-company/wave-maker-core'

  let {
    preset = 'ocean', colors, speed = 1.0, amplitude = 1.0,
    waveCount = 2, valley = false, valleyDepth = 0.32,
    blur = 1.0, noiseDetail = 4, fps = 60, pixelRatio,
    animate = true, class: className = '', ...restProps
  }: WaveMakerOptions & { class?: string; [key: string]: any } = $props()

  let canvasEl: HTMLCanvasElement
  let instance: WaveMakerCore | null = null

  $effect(() => {
    instance = new WaveMakerCore(canvasEl, {
      preset: preset as PresetName, colors, speed, amplitude,
      waveCount: waveCount as 1 | 2 | 3, valley, valleyDepth, blur, noiseDetail, fps, pixelRatio, animate,
    })
    return () => { instance?.destroy(); instance = null }
  })

  $effect(() => { if (instance && preset) instance.setPreset(preset as PresetName) })
  $effect(() => { if (instance && colors) instance.setColors(colors) })
  $effect(() => { if (instance) instance.setSpeed(speed) })
  $effect(() => { if (instance) instance.setAmplitude(amplitude) })
</script>

<div class={className} style="position: relative; overflow: hidden;" {...restProps}>
  <canvas bind:this={canvasEl} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;" />
</div>
