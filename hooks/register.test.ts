import { expect, test } from 'claude-code/testing'

import { formatElapsed, isHighlighted, spinnerFrame } from './register'

test('formats elapsed time', () => {
  expect(formatElapsed(0)).toBe('0s')
  expect(formatElapsed(52)).toBe('52s')
  expect(formatElapsed(64)).toBe('1m 4s')
})

test('highlight band sweeps across the label and wraps', () => {
  const lit = (tick: number) =>
    [0, 1, 2, 3, 4].filter(index => isHighlighted(index, tick, 5))
  expect(lit(0)).toEqual([])
  expect(lit(1)).toEqual([0])
  expect(lit(3)).toEqual([0, 1, 2])
  expect(lit(4)).toEqual([1, 2, 3])
  expect(lit(7)).toEqual([4])
  expect(lit(8)).toEqual([])
  expect(lit(11)).toEqual(lit(0))
})

test('spinner cycles through its frames', () => {
  expect(spinnerFrame(0)).toBe('⠋')
  expect(spinnerFrame(1)).not.toBe(spinnerFrame(0))
  expect(spinnerFrame(10)).toBe(spinnerFrame(0))
})
