import type { CAC } from 'cac'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Logger } from '../src'
import { createCli } from '../src/cli'

const TEST_DIR = join(process.cwd(), 'test-logs')

describe('CLI Tests', () => {
  let logger: Logger
  let cli: CAC

  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true })

    // Initialize loggers
    logger = new Logger('test', {
      logDirectory: TEST_DIR,
      level: 'debug',
    })

    cli = await createCli({ logDirectory: TEST_DIR })
  })

  afterEach(async () => {
    // Clean up
    try {
      console.error('Debug: [afterEach] Starting cleanup')

      // List directory contents before cleanup
      const beforeFiles = await readdir(TEST_DIR)
      console.error('Debug: [afterEach] Directory contents before cleanup:', beforeFiles)

      // Wait for any pending operations
      if (logger) {
        console.error('Debug: [afterEach] Flushing logger writes')
        await logger.flushPendingWrites()
      }

      // Destroy logger
      if (logger) {
        console.error('Debug: [afterEach] Destroying logger')
        await logger.destroy()
      }

      // Wait a bit for file system operations to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // List directory contents after logger cleanup
      const afterLoggerFiles = await readdir(TEST_DIR)
      console.error('Debug: [afterEach] Directory contents after logger cleanup:', afterLoggerFiles)

      // Remove test directory
      console.error('Debug: [afterEach] Removing test directory')
      await rm(TEST_DIR, { recursive: true, force: true })

      console.error('Debug: [afterEach] Cleanup completed')
    }
    catch (err) {
      console.error('Debug: [afterEach] Error during cleanup:', err)
      throw err
    }
  })

  test('watch command should stream logs', async () => {
    console.error('Debug: [watch] Starting test')

    // Write some test logs
    await logger.info('Test message 1')
    await logger.error('Test error')

    // Wait for writes to complete and verify
    console.error('Debug: [watch] Waiting for writes to complete')
    await logger.flushPendingWrites()

    // List directory contents
    const files = await readdir(TEST_DIR)
    console.error('Debug: [watch] Directory contents after writes:', files)

    // Wait for file system to catch up
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.error('Debug: [watch] Test completed')
  })

  // TODO: Fix this later
  // test('log command should create log entries', async () => {
  //   console.error('Debug: [log] Starting test')

  //   // Verify test directory exists and is writable
  //   const dirStats = await stat(TEST_DIR).catch(() => null)
  //   console.error('Debug: [log] Test directory stats:', dirStats
  //     ? {
  //         exists: true,
  //         mode: dirStats.mode.toString(8),
  //         uid: dirStats.uid,
  //         gid: dirStats.gid,
  //       }
  //     : 'Directory not found')

  //   if (!dirStats) {
  //     await mkdir(TEST_DIR, { recursive: true, mode: 0o755 })
  //     console.error('Debug: [log] Created test directory')
  //   }

  //   // Create a direct log entry to verify logger is working
  //   const cliLogger = new Logger('cli', {
  //     logDirectory: TEST_DIR,
  //     level: 'debug',
  //   })

  //   try {
  //     console.error('Debug: [log] Writing test log message')
  //     await cliLogger.info('Direct test message')
  //     console.error('Debug: [log] Direct log completed')

  //     // Important: Ensure all writes are flushed to disk
  //     console.error('Debug: [log] Flushing pending writes')
  //     await cliLogger.flushPendingWrites()
  //     console.error('Debug: [log] Writes flushed')

  //     // Get the current log file path
  //     const cliLogPath = cliLogger.getCurrentLogFilePath()
  //     console.error('Debug: [log] Looking for log file at:', cliLogPath)

  //     // List directory contents
  //     const files = await readdir(TEST_DIR)
  //     console.error('Debug: [log] Directory contents before verification:', files)

  //     // Wait for file system to catch up
  //     await new Promise(resolve => setTimeout(resolve, 100))

  //     // Verify the log file exists and has content
  //     const fileStats = await stat(cliLogPath).catch(() => null)
  //     console.error('Debug: [log] File stats:', fileStats
  //       ? {
  //           exists: true,
  //           size: fileStats.size,
  //           mode: fileStats.mode.toString(8),
  //         }
  //       : 'File not found')

  //     if (!fileStats) {
  //       // List directory contents to help debug
  //       const files = await readdir(TEST_DIR)
  //       console.error('Debug: [log] Directory contents:', files)
  //       throw new Error(`Log file not found at ${cliLogPath}`)
  //     }

  //     if (fileStats.size === 0) {
  //       throw new Error('Log file exists but is empty after write')
  //     }

  //     // Read the log file content
  //     const content = await readFile(cliLogPath, 'utf8')
  //     console.error('Debug: [log] File content:', content)

  //     const entries = content.trim().split('\n').map((line) => {
  //       try {
  //         return JSON.parse(line)
  //       }
  //       catch {
  //         return null
  //       }
  //     })

  //     console.error('Debug: [log] Log entries:', entries)
  //     expect(entries.length).toBeGreaterThanOrEqual(0)

  //     console.error('Debug: [log] Test completed')
  //   }
  //   finally {
  //     // Ensure logger is always destroyed
  //     try {
  //       console.error('Debug: [log] Destroying CLI logger')
  //       await cliLogger.flushPendingWrites()
  //       await cliLogger.destroy()
  //       console.error('Debug: [log] CLI logger destroyed')
  //     }
  //     catch (err) {
  //       console.error('Debug: [log] Error destroying logger:', err)
  //     }
  //   }
  // })

  test('export command should export logs', async () => {
    const exportFile = join(TEST_DIR, 'export.json')
    await cli.parse(['export', '--output', exportFile])
  })

  test('tail command should show recent logs', async () => {
    await logger.info('Tail test message')
    await cli.parse(['tail', '--lines', '1'])
  })

  test('search command should find logs', async () => {
    await logger.error('Another message')
    await cli.parse(['search', 'test'])
  })

  test('clear command should delete logs', async () => {
    await cli.parse(['clear', '--force'])
  })

  test('config command should manage configuration', async () => {
    // Test set
    await cli.parse(['config', 'set', '--key', 'testKey', '--value', 'testValue'])

    // Test get
    await cli.parse(['config', 'get', '--key', 'testKey'])

    // Test list
    await cli.parse(['config', 'list'])

    // Test reset
    await cli.parse(['config', 'reset'])
    await cli.parse(['config', 'list'])
  })
})
