import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

const frame = atom({ plugin: 'calm-spinner', key: 'frame' } as const, 0)
const elapsedSeconds = atom({ plugin: 'calm-spinner', key: 'elapsedSeconds' } as const, 0)

const FRAME_MS = 100
const BASE_COLOR = 'claude'
const BAND_WIDTH = 3
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

// Sweeps a bright band across the label, starting and ending off its edges.
export const isHighlighted = (index: number, tick: number, length: number): boolean => {
  const head = (tick % (length + 2 * BAND_WIDTH)) - BAND_WIDTH
  return index >= head && index < head + BAND_WIDTH
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
        <Text color={BASE_COLOR}>{spinnerFrame(tick)}</Text>{' '}
        {[...label].map((char, index, chars) =>
          isHighlighted(index, tick, chars.length) ? (
            <Text key={String(index)} color={BASE_COLOR} bold>
              {char}
            </Text>
          ) : (
            <Text key={String(index)} color={BASE_COLOR} dimColor>
              {char}
            </Text>
          ),
        )}
        <Text dimColor>  {formatElapsed(seconds)}</Text>
      </Text>
    )
  })
}
