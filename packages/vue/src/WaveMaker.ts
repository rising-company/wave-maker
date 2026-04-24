import {
  defineComponent,
  h,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  type PropType,
  type CSSProperties,
} from 'vue'
import {
  WaveMaker as WaveMakerCore,
  type PresetName,
} from '@rising-company/wave-maker-core'

export const WaveMaker = defineComponent({
  name: 'WaveMaker',
  inheritAttrs: false,
  props: {
    preset: {
      type: String as PropType<PresetName>,
      default: 'ocean',
    },
    colors: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    speed: {
      type: Number,
      default: 1.0,
    },
    amplitude: {
      type: Number,
      default: 1.0,
    },
    waveCount: {
      type: Number as PropType<1 | 2 | 3>,
      default: 2,
    },
    valley: {
      type: Boolean,
      default: false,
    },
    valleyDepth: {
      type: Number,
      default: 0.32,
    },
    blur: {
      type: Number,
      default: 1.0,
    },
    noiseDetail: {
      type: Number,
      default: 4,
    },
    fps: {
      type: Number,
      default: 60,
    },
    pixelRatio: {
      type: Number,
      default: undefined,
    },
    animate: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { attrs }) {
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

    const wrapperStyle: CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
    }

    const canvasStyle: CSSProperties = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    }

    return () =>
      h(
        'div',
        {
          class: attrs.class,
          id: attrs.id,
          style: { ...wrapperStyle, ...(attrs.style as any) },
        },
        [h('canvas', { ref: canvasRef, style: canvasStyle })]
      )
  },
})
