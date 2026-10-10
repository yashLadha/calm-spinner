import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

const frame = atom({ plugin: 'calm-spinner', key: 'frame' } as const, 0)
const elapsedSeconds = atom({ plugin: 'calm-spinner', key: 'elapsedSeconds' } as const, 0)

const FRAME_MS = 100
const HUE_START = 280
const HUE_SPAN = 120
const HUE_STEP = 12
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const

const LABELS = {
  requesting: 'waiting',
  responding: 'writing',
  thinking: 'thinking',
  'tool-input': 'working',
  'tool-use': 'working',
} as const

export const spinnerFrame = (tick: number): string =>
  SPINNER_FRAMES[tick % SPINNER_FRAMES.length] ?? SPINNER_FRAMES[0]

export const formatElapsed = (seconds: number): string =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`

const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const a = saturation * Math.min(lightness, 1 - lightness)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

// Sweeps back and forth across the hue band so the wave never jumps.
export const gradientColor = (index: number, tick: number): string => {
  const position = ((index - tick) * HUE_STEP) % (2 * HUE_SPAN)
  const offset = Math.abs(position < 0 ? position + 2 * HUE_SPAN : position)
  const hue = HUE_START + (offset > HUE_SPAN ? 2 * HUE_SPAN - offset : offset)
  return hslToHex(hue % 360, 0.85, 0.68)
}

export const register: Register = on => {
  let tick: Timer | undefined

  on('turn.start', async ($, e, next) => {
    tick?.cancel()
    const startedAt = await $.clock.now()
    await update($, elapsedSeconds, () => 0)
    tick = $.clock.every(FRAME_MS, async () => {
      const seconds = Math.floor(((await $.clock.now()) - startedAt) / 1000)
      await update($, frame, value => value + 1)
      await update($, elapsedSeconds, () => seconds)
    })

    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    tick?.cancel()
    tick = undefined

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const { Text } = $.ui.resolve(e)
    const label = e.props.message ?? LABELS[e.props.mode]
    const tick = await read($, frame)
    const seconds = await read($, elapsedSeconds)

    return (
      <Text>
        <Text color={gradientColor(0, tick)}>{spinnerFrame(tick)}</Text>{' '}
        {[...label].map((char, index) => (
          <Text key={String(index)} color={gradientColor(index, tick)} bold>
            {char}
          </Text>
        ))}
        <Text dimColor>  {formatElapsed(seconds)}</Text>
      </Text>
    )
  })
}
