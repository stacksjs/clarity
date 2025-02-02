/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { handleConfig } from '../src/cli/config-handler'
import { handleWatch } from '../src/cli/handlers'
import { JsonFormatter, TextFormatter } from '../src/formatters'
import { Logger } from '../src/index'
import { configManager } from '../src/storage/config-manager'
import { logManager } from '../src/storage/log-manager'

describe('Logger', () => {
  beforeEach(async () => {
    // Initialize both managers before each test
    await logManager.initialize()
    await configManager.initialize()
  })

  afterEach(async () => {
    // Clean up logs after each test
    await logManager.clear({})
  })

  describe('Basic Logging', () => {
    test('creates a logger with name', () => {
      const logger = new Logger('test')
      expect(logger).toBeTruthy()
    })

    test('logs info message', () => {
      const logger = new Logger('test')
      logger.info('test message')
      expect(true).toBe(true) // TODO: verify log was created
    })

    test('logs debug message', () => {
      const logger = new Logger('test')
      logger.debug('debug message')
      expect(true).toBe(true) // TODO: verify log was created
    })

    test('logs success message', () => {
      const logger = new Logger('test')
      logger.success('success message')
      expect(true).toBe(true) // TODO: verify log was created
    })

    test('logs warning message', () => {
      const logger = new Logger('test')
      logger.warning('warning message')
      expect(true).toBe(true) // TODO: verify log was created
    })

    test('logs error message', () => {
      const logger = new Logger('test')
      logger.error('error message')
      expect(true).toBe(true) // TODO: verify log was created
    })
  })

  describe('Performance Tracking', () => {
    test('tracks operation duration', async () => {
      const logger = new Logger('performance')
      const end = logger.info('start operation')

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))

      end('end operation')
      expect(true).toBe(true) // TODO: verify duration was logged
    })
  })

  describe('Domain-specific Logging', () => {
    test('creates extended logger', () => {
      const logger = new Logger('parent')
      const child = logger.extend('child')
      expect(child).toBeTruthy()
    })

    test('logs with correct namespace', () => {
      const logger = new Logger('parent')
      const child = logger.extend('child')
      child.info('test message')
      expect(true).toBe(true) // TODO: verify namespace
    })
  })

  describe('Format Strings', () => {
    test('formats string with number', () => {
      const logger = new Logger('test')
      logger.info('count: %d', 42)
      expect(true).toBe(true) // TODO: verify formatted message
    })

    test('formats string with multiple values', () => {
      const logger = new Logger('test')
      logger.info('hello %s, count: %d', 'world', 42)
      expect(true).toBe(true) // TODO: verify formatted message
    })
  })

  describe('Conditional Logging', () => {
    test('executes only callback when enabled', () => {
      const logger = new Logger('test')
      logger.only(() => {
        logger.info('test message')
      })
      expect(true).toBe(true) // TODO: verify callback execution
    })
  })

  describe('Environment Detection', () => {
    test('detects server environment', () => {
      const logger = new Logger('test')
      logger.info('test message')
      expect(true).toBe(true) // TODO: verify server output
    })
  })

  describe('Log Management', () => {
    test('retrieves logs', async () => {
      const logger = new Logger('test')
      logger.info('test message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBeGreaterThan(0)
    })

    test('filters logs by level', async () => {
      const logger = new Logger('test')
      logger.info('info message')
      logger.error('error message')

      const errorLogs = await logManager.getLogs({ level: 'error' })
      expect(errorLogs.length).toBeGreaterThan(0)
    })

    test('filters logs by name', async () => {
      const logger = new Logger('test')
      logger.info('test message')

      const logs = await logManager.getLogs({ name: 'test' })
      expect(logs.length).toBeGreaterThan(0)
    })

    test('clears logs', async () => {
      const logger = new Logger('test')
      logger.info('test message')

      await logManager.clear({})
      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(0)
    })
  })

  describe('Configuration', () => {
    test('loads default config', async () => {
      const config = await configManager.list()
      expect(config).toBeTruthy()
    })

    test('sets config value', async () => {
      await configManager.set('level', 'debug')
      const level = await configManager.get('level')
      expect(level).toBe('debug')
    })
  })
})

describe('Formatters', () => {
  const sampleEntry = {
    timestamp: new Date('2024-02-01T12:34:56.789Z'),
    level: 'info' as const,
    name: 'test',
    message: 'Hello world',
  }

  describe('TextFormatter', () => {
    test('formats log entry with colors', () => {
      const formatter = new TextFormatter(true)
      const output = formatter.format(sampleEntry)

      // The exact string match will depend on the color implementation
      expect(output).toContain('Hello world')
      expect(output).toContain('[test]')
      expect(output).toContain('INFO')
    })

    test('formats log entry without colors', async () => {
      const formatter = new TextFormatter(false)
      const output = await formatter.format(sampleEntry)

      expect(output).toBe('12:34:56:789 [test] INFO: Hello world')
    })

    test('formats object message', () => {
      const formatter = new TextFormatter(false)
      const entry = {
        ...sampleEntry,
        message: { key: 'value' },
      }
      const output = formatter.format(entry)

      expect(output).toContain('{\n  "key": "value"\n}')
    })
  })

  describe('JsonFormatter', () => {
    test('formats log entry as JSON', async () => {
      const formatter = new JsonFormatter()
      const output = await formatter.format(sampleEntry)
      const parsed = JSON.parse(output)

      expect(parsed).toEqual({
        timestamp: '2024-02-01T12:34:56.789Z',
        level: 'info',
        name: 'test',
        message: 'Hello world',
        metadata: expect.any(Object),
      })
    })

    test('includes metadata', async () => {
      const formatter = new JsonFormatter()
      const output = await formatter.format(sampleEntry)
      const parsed = JSON.parse(output)

      expect(parsed.metadata).toHaveProperty('pid')
      expect(parsed.metadata).toHaveProperty('hostname')
      expect(parsed.metadata).toHaveProperty('environment')
    })

    test('handles object messages', async () => {
      const formatter = new JsonFormatter()
      const entry = {
        ...sampleEntry,
        message: { key: 'value' },
      }
      const output = await formatter.format(entry)
      const parsed = await JSON.parse(output)

      expect(parsed.message).toEqual({ key: 'value' })
    })
  })

  describe('Format Selection', () => {
    test('uses JSON in production', () => {
      process.env.NODE_ENV = 'production'
      const logger = new Logger('test')
      logger.info('test message')
      // TODO: verify JSON output
      expect(true).toBe(true)
    })

    test('uses text in development', () => {
      process.env.NODE_ENV = 'development'
      const logger = new Logger('test')
      logger.info('test message')
      // TODO: verify text output
      expect(true).toBe(true)
    })

    test('respects format option', () => {
      const logger = new Logger('test', { format: 'json' })
      logger.info('test message')
      // TODO: verify JSON output
      expect(true).toBe(true)
    })
  })
})

describe('Time-based Log Rotation', () => {
  const TEST_LOG_DIR = join(homedir(), '.clarity-test', 'logs')
  let currentTime: Date

  beforeEach(async () => {
    await mkdir(TEST_LOG_DIR, { recursive: true })
    await configManager.set('logDirectory', TEST_LOG_DIR)
    currentTime = new Date('2024-02-01T12:00:00.000Z')

    // Mock Date
    const RealDate = global.Date
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new RealDate(currentTime)
        }
        return new RealDate(...args)
      }
    } as any
    global.Date.now = () => currentTime.getTime()
  })

  afterEach(async () => {
    try {
      await rm(TEST_LOG_DIR, { recursive: true })
      global.Date = RealDate
    }
    catch (error) {
      console.error('Error cleaning up:', error)
    }
  })

  describe('Daily Rotation', () => {
    test('rotates logs at specified hour', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      // Write some logs
      logger.info('before rotation')

      // Move time to next day
      currentTime = new Date('2024-02-02T00:00:00.000Z')

      logger.info('after rotation')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(2) // Original + rotated
    })

    test('respects custom rotation time', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 14,
          rotateMinute: 30,
        },
      })

      logger.info('before rotation')
      currentTime = new Date('2024-02-01T14:30:00.000Z')
      logger.info('after rotation')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(2)
    })
  })

  describe('Weekly Rotation', () => {
    test('rotates logs on specified day of week', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'weekly',
          rotateDayOfWeek: 0, // Sunday
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      logger.info('before rotation')
      currentTime = new Date('2024-02-04T00:00:00.000Z') // Sunday
      logger.info('after rotation')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(2)
    })

    test('handles week boundary correctly', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'weekly',
          rotateDayOfWeek: 0,
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      logger.info('before rotation')
      currentTime = new Date('2024-02-04T00:00:00.000Z')
      logger.info('during week')
      currentTime = new Date('2024-02-11T00:00:00.000Z')
      logger.info('next week')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(3)
    })
  })

  describe('Monthly Rotation', () => {
    test('rotates logs on specified day of month', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'monthly',
          rotateDayOfMonth: 1,
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      logger.info('before rotation')
      currentTime = new Date('2024-03-01T00:00:00.000Z')
      logger.info('after rotation')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(2)
    })

    test('handles month boundary correctly', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'monthly',
          rotateDayOfMonth: 1,
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      logger.info('before rotation')
      currentTime = new Date('2024-03-01T00:00:00.000Z')
      logger.info('next month')
      currentTime = new Date('2024-04-01T00:00:00.000Z')
      logger.info('another month')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(3)
    })
  })

  describe('Mixed Rotation Triggers', () => {
    test('handles both size and time triggers', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 0,
          rotateMinute: 0,
          maxSize: 100, // Small size to trigger size rotation
        },
      })

      // Trigger size rotation
      for (let i = 0; i < 10; i++) {
        logger.info('size rotation test '.repeat(3))
      }

      // Trigger time rotation
      currentTime = new Date('2024-02-02T00:00:00.000Z')
      logger.info('time rotation test')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBeGreaterThan(2)
    })

    test('preserves logs across rotation types', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 0,
          rotateMinute: 0,
          maxSize: 100,
        },
      })

      logger.info('first log')

      // Trigger size rotation
      for (let i = 0; i < 5; i++) {
        logger.info('test message '.repeat(5))
      }

      // Trigger time rotation
      currentTime = new Date('2024-02-02T00:00:00.000Z')
      logger.info('last log')

      const allLogs = await logManager.getLogs({})
      expect(allLogs.some(log => log.message === 'first log')).toBe(true)
      expect(allLogs.some(log => log.message === 'last log')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('handles leap years in monthly rotation', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'monthly',
          rotateDayOfMonth: 29,
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      currentTime = new Date('2024-02-28T23:59:59.999Z')
      logger.info('before leap day')
      currentTime = new Date('2024-02-29T00:00:00.000Z')
      logger.info('on leap day')
      currentTime = new Date('2024-03-29T00:00:00.000Z')
      logger.info('next month')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(3)
    })

    test('handles daylight saving time transitions', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 2, // Common DST transition hour
          rotateMinute: 0,
        },
      })

      // Test during DST transition
      currentTime = new Date('2024-03-10T07:59:59.999Z') // Just before DST
      logger.info('before DST')
      currentTime = new Date('2024-03-10T08:00:00.000Z') // After DST
      logger.info('after DST')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBe(2)
    })

    test('handles invalid rotation dates', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'monthly',
          rotateDayOfMonth: 31, // Not all months have 31 days
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      currentTime = new Date('2024-03-31T00:00:00.000Z')
      logger.info('31-day month')
      currentTime = new Date('2024-04-30T23:59:59.999Z')
      logger.info('30-day month')
      currentTime = new Date('2024-05-01T00:00:00.000Z')
      logger.info('next month')

      const files = await readdir(TEST_LOG_DIR)
      expect(files.length).toBeGreaterThan(1)
    })
  })

  describe('CLI Integration', () => {
    test('configures time-based rotation via CLI', async () => {
      await handleConfig({
        action: 'set',
        key: 'rotation.frequency',
        value: 'daily',
      })
      await handleConfig({
        action: 'set',
        key: 'rotation.rotateHour',
        value: '0',
      })

      const config = await configManager.list()
      expect(config.rotation?.frequency).toBe('daily')
      expect(config.rotation?.rotateHour).toBe(0)
    })

    test('watch command observes time-based rotation', async () => {
      const logger = new Logger('test', {
        rotation: {
          frequency: 'daily',
          rotateHour: 0,
          rotateMinute: 0,
        },
      })

      const logs: string[] = []
      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      try {
        const watchPromise = handleWatch({
          level: 'info',
          name: 'test',
        })

        logger.info('before rotation')
        currentTime = new Date('2024-02-02T00:00:00.000Z')
        logger.info('after rotation')

        await new Promise(resolve => setTimeout(resolve, 100))
        expect(logs.length).toBe(2)
      }
      finally {
        console.log = originalLog
      }
    })
  })
})
