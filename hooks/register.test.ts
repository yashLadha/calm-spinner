import { expect, test } from 'claude-code/testing'

import { formatElapsed, gradientColor, spinnerFrame } from './register'

test('formats elapsed time', () => {
  expect(formatElapsed(0)).toBe('0s')
  expect(formatElapsed(52)).toBe('52s')
  expect(formatElapsed(64)).toBe('1m 4s')
})

test('gradient colors are hex and move with the tick', () => {
  expect(gradientColor(0, 0)).toMatch(/^#[0-9a-f]{6}$/)
  expect(gradientColor(3, 1)).not.toBe(gradientColor(3, 0))
  expect(gradientColor(1, 1)).toBe(gradientColor(0, 0))
})

test('spinner cycles through its frames', () => {
  expect(spinnerFrame(0)).toBe('⠋')
  expect(spinnerFrame(1)).not.toBe(spinnerFrame(0))
  expect(spinnerFrame(10)).toBe(spinnerFrame(0))
})
