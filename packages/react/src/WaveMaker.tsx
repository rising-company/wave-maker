import { useEffect, useRef, type CSSProperties } from 'react'
import {
  WaveMaker as WaveMakerCore,
  type WaveMakerOptions,
  type PresetName,
} from '@rising-company/wave-maker-core'

export interface WaveMakerProps extends WaveMakerOptions {
  /** CSS class name for the wrapper div */
  className?: string
  /** Inline styles for the wrapper div */
  style?: CSSProperties
  /** HTML id attribute for the wrapper div */
  id?: string
}

const wrapperStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
}

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
}

export function WaveMaker({
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
  className,
  style,
  id,
}: WaveMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<WaveMakerCore | null>(null)

  // Create and destroy WaveMaker instance
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const instance = new WaveMakerCore(canvas, {
      preset: preset as PresetName,
      colors,
      speed,
      amplitude,
      waveCount: waveCount as 1 | 2 | 3,
      valley,
      valleyDepth,
      blur,
      noiseDetail,
      fps,
      pixelRatio,
      animate,
    })
    instanceRef.current = instance

    return () => {
      instance.destroy()
      instanceRef.current = null
    }
    // Only re-create when mount/unmount — individual props handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update preset
  useEffect(() => {
    if (instanceRef.current && preset) {
      instanceRef.current.setPreset(preset as PresetName)
    }
  }, [preset])

  // Update colors
  useEffect(() => {
    if (instanceRef.current && colors) {
      instanceRef.current.setColors(colors)
    }
  }, [colors])

  // Update speed
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setSpeed(speed)
    }
  }, [speed])

  // Update amplitude
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setAmplitude(amplitude)
    }
  }, [amplitude])

  return (
    <div
      className={className}
      style={{ ...wrapperStyle, ...style }}
      id={id}
    >
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  )
}
