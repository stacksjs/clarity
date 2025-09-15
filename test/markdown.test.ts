import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Logger } from '../src'

const TEST_LOG_DIR = join(process.cwd(), 'test-logs-markdown')

// ANSI escape sequence matcher
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1B\[[0-9;]*m/g

describe('Markdown logging (file saving only)', () => {
  let logger: Logger

  beforeEach(async () => {
    await mkdir(TEST_LOG_DIR, { recursive: true })

    logger = new Logger('markdown-test', {
      logDirectory: TEST_LOG_DIR,
      level: 'debug',
      // Ensure logs are written to file so we can assert contents
      writeToFile: true,
      // Use text format to align with typical console mode, though file output is independent
      format: 'text',
      // Disable rotation for determinism in tests
      rotation: false as any,
    })
  })

  afterEach(async () => {
    // await logger.destroy()
    // await rm(TEST_LOG_DIR, { recursive: true, force: true })
  })

  it('writes raw markdown (no ANSI) to file while console styling is separate', async () => {
    const msg = 'Hello **bold** *italic* ~strike~ `code` [link](https://example.com)'

    await logger.info(msg)

    // Ensure all pending writes are flushed
    await logger.flushPendingWrites()

    const logPath = logger.getCurrentLogFilePath()
    expect(existsSync(logPath)).toBe(true)

    const content = await readFile(logPath, 'utf8')

    // File should contain the raw markdown text (no ANSI styling applied)
    expect(content).toContain(msg)

    // Ensure there are no ANSI escape codes in the saved file
    expect(ANSI_REGEX.test(content)).toBe(false)
  })

  it('writes raw markdown when inline code contains HTML tags (h1, p) without ANSI', async () => {
    const code = '<h1>hello world</h1><p>paragraph</p>'
    const msg = `Hello **bold** *italic* ~strike~ \`${code}\` [link](https://example.com)`

    await logger.info(msg)
    await logger.flushPendingWrites()

    const logPath = logger.getCurrentLogFilePath()
    expect(existsSync(logPath)).toBe(true)

    const content = await readFile(logPath, 'utf8')

    // Raw markdown (including inline code with HTML) should be preserved
    expect(content).toContain(msg)

    // Ensure there are no ANSI escape codes in the saved file
    expect(ANSI_REGEX.test(content)).toBe(false)
  })

  it('writes raw markdown with a local file link (./README.md) without ANSI', async () => {
    const msg = 'Open [README](./README.md) to learn more'

    await logger.info(msg)
    await logger.flushPendingWrites()

    const logPath = logger.getCurrentLogFilePath()
    expect(existsSync(logPath)).toBe(true)

    const content = await readFile(logPath, 'utf8')

    // File should contain the raw markdown text
    expect(content).toContain(msg)

    // Ensure there are no ANSI escape codes in the saved file
    expect(ANSI_REGEX.test(content)).toBe(false)
  })

  it('writes raw markdown with a file:// URL without ANSI', async () => {
    const abs = join(process.cwd(), 'README.md')
    const msg = `See [docs](file://${abs}) for details`

    await logger.info(msg)
    await logger.flushPendingWrites()

    const logPath = logger.getCurrentLogFilePath()
    expect(existsSync(logPath)).toBe(true)

    const content = await readFile(logPath, 'utf8')

    // File should contain the raw markdown text
    expect(content).toContain(msg)

    // Ensure there are no ANSI escape codes in the saved file
    expect(ANSI_REGEX.test(content)).toBe(false)
  })
})
