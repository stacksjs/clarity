/* eslint-disable no-console */
import type { CAC, Command } from 'cac'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createCli } from '../src/cli'
import { Logger } from '../src/logger'

const TEST_DIR = join(process.cwd(), 'test-logs')
const TODAY = new Date().toISOString().split('T')[0]

// Mock readline module
mock.module('node:readline', () => ({
  createInterface: () => ({
    question: (_: string, cb: (answer: string) => void) => cb('y'),
    close: () => {},
  }),
}))

describe('CLI Tests', () => {
  let logger: Logger
  let cli: any

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true })
    logger = new Logger('test', { logDirectory: TEST_DIR })
    cli = await createCli({ logDirectory: TEST_DIR })

    // Set log level to debug to ensure all logs are captured
    logger.config.level = 'debug'
  })

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true })
  })

  test('watch command should stream logs', async () => {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (msg: string) => logs.push(msg)

    try {
      await logger.info('Test message 1')
      await logger.error('Test error')

      await cli.runMatchedCommand(['watch'])
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(log => log.includes('Test message 1'))).toBe(true)
      expect(logs.some(log => log.includes('Test error'))).toBe(true)
    }
    finally {
      console.log = originalLog
    }
  })

  test('log command should create log entries', async () => {
    console.error('Debug: Starting log command test')

    // Check if test directory exists and has correct permissions
    const dirStats = await stat(TEST_DIR)
    console.error('Debug: Test directory stats:', {
      exists: true,
      mode: dirStats.mode.toString(8),
      uid: dirStats.uid,
      gid: dirStats.gid,
    })

    console.error('Debug: Running log command')

    try {
      // Log directly first to verify logger works
      await logger.info('Direct test message')
      console.error('Debug: Direct log completed')

      // Then try through CLI
      console.error('Debug: CLI instance:', cli)
      console.error('Debug: CLI commands:', cli.commands)
      const logCommand = cli.commands.find((cmd: Command) => cmd.name === 'log')
      console.error('Debug: Log command:', logCommand)

      if (!logCommand) {
        throw new Error('Log command not found in CLI')
      }

      await logCommand.action('Test log message', { level: 'info' })
      console.error('Debug: Log command completed')

      // Add a longer delay to ensure writes are flushed
      await new Promise(resolve => setTimeout(resolve, 500))
      console.error('Debug: Delay completed')

      // Debug: List files in test directory
      const files = await readdir(TEST_DIR)
      console.error('Debug: Files in test directory:', files)

      // Try both possible log file names
      const cliLogPath = join(TEST_DIR, `cli-${TODAY}.log`)
      const testLogPath = join(TEST_DIR, `test-${TODAY}.log`)
      console.error('Debug: Checking log files:', { cliLogPath, testLogPath })

      // Check if files exist
      const cliFileExists = await stat(cliLogPath).catch(() => null)
      const testFileExists = await stat(testLogPath).catch(() => null)
      console.error('Debug: File existence:', {
        cliLogExists: !!cliFileExists,
        testLogExists: !!testFileExists,
        cliLogStats: cliFileExists
          ? {
              size: cliFileExists.size,
              mode: cliFileExists.mode.toString(8),
            }
          : null,
        testLogStats: testFileExists
          ? {
              size: testFileExists.size,
              mode: testFileExists.mode.toString(8),
            }
          : null,
      })

      let entries = await logger.readLog(cliLogPath)
      if (entries.length === 0) {
        console.error('No entries found in cli.log, trying test.log')
        entries = await logger.readLog(testLogPath)
      }

      console.error('Debug: Found entries:', entries)
      expect(entries.length).toBeGreaterThan(0)
      expect(entries[0].message).toBe('Test log message')
      expect(entries[0].level).toBe('info')
    }
    catch (err) {
      console.error('Debug: Error during test:', err)
      throw err
    }
  })

  test('export command should write logs to file', async () => {
    await logger.info('Export test message')
    const exportFile = join(TEST_DIR, 'export.json')

    await cli.runMatchedCommand(['export', '--output', exportFile])

    const content = await Bun.file(exportFile).text()
    expect(content).toContain('Export test message')
  })

  test('tail command should show recent logs', async () => {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (msg: string) => logs.push(msg)

    try {
      await logger.info('Tail test message')

      await cli.runMatchedCommand(['tail', '--lines', '1'])

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0]).toContain('Tail test message')
    }
    finally {
      console.log = originalLog
    }
  })

  test('search command should find matching logs', async () => {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (msg: string) => logs.push(msg)

    try {
      await logger.info('Search test message')
      await logger.error('Another message')

      await cli.runMatchedCommand(['search', 'test'])

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(log => log.includes('Search test message'))).toBe(true)
      expect(logs.every(log => !log.includes('Another message'))).toBe(true)
    }
    finally {
      console.log = originalLog
    }
  })

  test('clear command should remove logs', async () => {
    await logger.info('Clear test message')

    try {
      await cli.runMatchedCommand(['clear', '--force'])

      const entries = await logger.readLog(join(TEST_DIR, `test-${TODAY}.log`))
      expect(entries.length).toBe(0)
    }
    catch (error) {
      console.error('Clear test error:', error)
      throw error
    }
  })

  test('config command should manage configuration', async () => {
    // Test set
    await cli.runMatchedCommand(['config', 'set', '--key', 'testKey', '--value', 'testValue'])

    // Test get
    const logs: string[] = []
    const originalLog = console.log
    console.log = (msg: string) => logs.push(msg)

    try {
      await cli.runMatchedCommand(['config', 'get', '--key', 'testKey'])
      expect(logs[0]).toBe('testValue')

      // Test list
      logs.length = 0
      await cli.runMatchedCommand(['config', 'list'])
      expect(logs[0]).toContain('testKey')
      expect(logs[0]).toContain('testValue')

      // Test reset
      logs.length = 0
      await cli.runMatchedCommand(['config', 'reset'])
      await cli.runMatchedCommand(['config', 'list'])
      expect(logs[0]).toBe('{}')
    }
    finally {
      console.log = originalLog
    }
  })
})
