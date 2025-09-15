import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { isGhostty, makeOsc8Link, supportsOsc8 } from '../src/utils'

const originalEnv = { ...process.env }

describe('Ghostty / OSC8 integration', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NO_OSC8
    delete process.env.FORCE_OSC8
    delete process.env.TERM_PROGRAM
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('makeOsc8Link generates proper OSC8 sequence', () => {
    const text = 'Click here'
    const url = 'https://example.com'
    const out = makeOsc8Link(text, url)
    // ESC ] 8 ;; url ST text ESC ] 8 ;; ST
    expect(out).toContain('\u001B]8;;https://example.com\u0007')
    expect(out).toContain('Click here')
    expect(out.endsWith('\u001B]8;;\u0007')).toBe(true)
  })

  it('supportsOsc8 respects NO_OSC8 and FORCE_OSC8', () => {
    process.env.NO_OSC8 = '1'
    expect(supportsOsc8()).toBe(false)

    process.env.NO_OSC8 = '0'
    process.env.FORCE_OSC8 = '1'
    expect(supportsOsc8()).toBe(true)
  })

  it('supportsOsc8 detects known terminals including Ghostty', () => {
    process.env.TERM_PROGRAM = 'Ghostty'
    expect(supportsOsc8()).toBe(true)
  })

  it('isGhostty detects Ghostty by TERM_PROGRAM', () => {
    process.env.TERM_PROGRAM = 'Ghostty'
    expect(isGhostty()).toBe(true)
    process.env.TERM_PROGRAM = 'iTerm.app'
    expect(isGhostty()).toBe(false)
  })
})
