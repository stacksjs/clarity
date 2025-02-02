// /* eslint-disable no-console */
// import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
// import { mkdir, readdir, rm } from 'node:fs/promises'
// import { homedir } from 'node:os'
// import { join } from 'node:path'
// import { handleConfig } from '../src/cli/config-handler'
// import { handleWatch } from '../src/cli/handlers'
// import { Logger } from '../src/index'
// import { configManager } from '../src/storage/config-manager'
// import { logManager } from '../src/storage/log-manager'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { TextFormatter } from '../src/formatters'
import { Logger } from '../src/index'
import { configManager } from '../src/storage/config-manager'
import { logManager } from '../src/storage/log-manager'

const TEST_LOG_DIR = join(homedir(), '.clarity-test', 'logs')

describe('Logger', () => {
  beforeEach(async () => {
    // Create test directory and initialize managers
    await mkdir(TEST_LOG_DIR, { recursive: true })
    await configManager.set('logDirectory', TEST_LOG_DIR)
    await logManager.initialize()
    await configManager.initialize()
  })

  afterEach(async () => {
    // Clean up logs and test directory after each test
    await logManager.clear({})
    try {
      await rm(TEST_LOG_DIR, { recursive: true })
    }
    catch (error) {
      console.error('Error cleaning up:', error)
    }
  })

  describe('Basic Logging', () => {
    test('creates a logger with name', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      expect(logger).toBeTruthy()
      expect(logger.name).toBe('test')
    })

    describe('Formatters', () => {
      test('formats string with positionals', async () => {
        const logger = new Logger('test', { formatter: new TextFormatter(false) })
        await logger.initialize()
        logger.info('count: %d, name: %s', 42, 'test')

        const logs = await logManager.getLogs({})
        expect(logs.length).toBe(1)
        expect(logs[0].message).toBe('count: 42, name: test')
      })

      test('formats error objects', async () => {
        const logger = new Logger('test', { formatter: new TextFormatter(false) })
        await logger.initialize()
        const error = new Error('test error')
        logger.error(error)

        const logs = await logManager.getLogs({})
        expect(logs.length).toBe(1)
        expect(logs[0].message).toContain('test error')
      })

      test('formats object messages as JSON', async () => {
        const logger = new Logger('test', { formatter: new TextFormatter(false) })
        await logger.initialize()
        const obj = { name: 'test', value: 42 }
        logger.info(obj)

        const logs = await logManager.getLogs({})
        expect(logs.length).toBe(1)
        const parsed = JSON.parse(logs[0].message)
        expect(parsed).toEqual(obj)
      })

      test('handles JSON formatter output', async () => {
        const logger = new Logger('test', { format: 'json' })
        await logger.initialize()
        logger.info('test message')

        const logs = await logManager.getLogs({})
        expect(logs.length).toBe(1)
        // The message itself is not JSON, but rather a raw string
        expect(logs[0].message).toBe('test message')
        expect(logs[0].level).toBe('info')
        expect(logs[0].name).toBe('test')
      })

      test('respects color settings in text formatter', async () => {
        // Test with colors enabled
        const colorLogger = new Logger('test', { format: 'text', colors: true })
        await colorLogger.initialize()
        const colorOutput = await (colorLogger as any).formatter.format({
          timestamp: new Date(),
          level: 'info',
          name: 'test',
          message: 'colored message',
        })

        // Test with colors disabled
        const noColorLogger = new Logger('test', { format: 'text', colors: false })
        await noColorLogger.initialize()
        const plainOutput = await (noColorLogger as any).formatter.format({
          timestamp: new Date(),
          level: 'info',
          name: 'test',
          message: 'plain message',
        })

        // The colored output should contain ANSI escape codes
        expect(colorOutput).toContain('\x1B[')
        // The plain output should not contain ANSI escape codes
        expect(plainOutput).not.toContain('\x1B[')
      })
    })

    test('logs info message', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.info('test message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('test message')
      expect(logs[0].name).toBe('test')
    })

    test('logs debug message', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.debug('debug message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('debug')
      // Remove ANSI color codes for comparison
      expect(logs[0].message).toInclude('debug message')
      expect(logs[0].name).toBe('test')
    })

    test('logs success message', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.success('success message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('success')
      expect(logs[0].message).toContain('success message')
      expect(logs[0].name).toBe('test')
    })

    test('logs warning message', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.warning('warning message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('warning')
      expect(logs[0].message).toContain('warning message')
      expect(logs[0].name).toBe('test')
    })

    test('logs error message', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.error('error message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toContain('error message')
      expect(logs[0].name).toBe('test')
    })

    test('tracks operation duration', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      const end = logger.info('start operation')

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))

      end('end operation')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(2)
      expect(logs[0].message).toBe('start operation')
      expect(logs[1].message).toContain('end operation')
      expect(logs[1].message).toContain('ms') // Duration should be included
    })

    test('creates extended logger with correct namespace', async () => {
      const parentLogger = new Logger('parent', { formatter: new TextFormatter(false) })
      await parentLogger.initialize()
      const childLogger = parentLogger.extend('child')
      await childLogger.initialize()

      childLogger.info('test message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].name).toBe('parent:child')
      expect(logs[0].message).toBe('test message')
    })
  })

  describe('Log Management', () => {
    test('filters logs by level', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.info('info message')
      logger.error('error message')
      logger.warning('warning message')

      const errorLogs = await logManager.getLogs({ level: 'error' })
      expect(errorLogs.length).toBe(1)
      expect(errorLogs[0].level).toBe('error')
      expect(errorLogs[0].message).toBe('error message')
    })

    test('filters logs by logger name', async () => {
      const logger1 = new Logger('test1', { formatter: new TextFormatter(false) })
      const logger2 = new Logger('test2', { formatter: new TextFormatter(false) })
      await logger1.initialize()
      await logger2.initialize()

      logger1.info('test1 message')
      logger2.info('test2 message')

      const test1Logs = await logManager.getLogs({ name: 'test1' })
      expect(test1Logs.length).toBe(1)
      expect(test1Logs[0].name).toBe('test1')
      expect(test1Logs[0].message).toBe('test1 message')
    })

    test('filters logs by date range', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()

      const startDate = new Date()
      await new Promise(resolve => setTimeout(resolve, 50))
      logger.info('middle message')
      await new Promise(resolve => setTimeout(resolve, 50))
      const endDate = new Date()
      logger.info('late message')

      const logs = await logManager.getLogs({ start: startDate, end: endDate })
      expect(logs.length).toBe(1)
      expect(logs[0].message).toBe('middle message')
    })

    test('searches logs by pattern', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()

      logger.info('apple message')
      logger.info('banana message')
      logger.info('apple pie')

      const logs = await logManager.search('apple', {})
      expect(logs.length).toBe(2)
      expect(logs.every(log => log.message.includes('apple'))).toBe(true)
    })

    test('performs case-sensitive search', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()

      logger.info('APPLE message')
      logger.info('apple message')

      const logs = await logManager.search('APPLE', { caseSensitive: true })
      expect(logs.length).toBe(1)
      expect(logs[0].message).toBe('APPLE message')
    })
  })

  describe('Configuration', () => {
    test('loads default config', async () => {
      const config = await configManager.list()
      expect(config.level).toBe('info')
      expect(config.defaultName).toBe('app')
      expect(config.verbose).toBe(false)
    })

    test('sets and gets config values', async () => {
      await configManager.set('level', 'debug')
      const level = await configManager.get('level')
      expect(level).toBe('debug')
    })

    test('handles invalid config keys gracefully', async () => {
      const value = await configManager.get('nonexistentKey')
      expect(value).toBeUndefined()
    })

    test('properly initializes logger with config', async () => {
      await configManager.set('level', 'error')
      await configManager.set('defaultName', 'testApp')

      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.info('should not log')
      logger.error('should log')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('error')
    })

    test('maintains config persistence', async () => {
      const testValue = `test-value-${Date.now()}`
      await configManager.set('customKey', testValue)

      // Re-initialize config manager to test persistence
      await configManager.initialize()

      const value = await configManager.get('customKey')
      expect(value).toBe(testValue)
    })
  })

  describe('Formatters', () => {
    test('formats string with positionals', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      logger.info('count: %d, name: %s', 42, 'test')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].message).toBe('count: 42, name: test')
    })

    test('formats error objects', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      const error = new Error('test error')
      logger.error(error)

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      expect(logs[0].message).toContain('test error')
    })

    test('formats object messages as JSON', async () => {
      const logger = new Logger('test', { formatter: new TextFormatter(false) })
      await logger.initialize()
      const obj = { name: 'test', value: 42 }
      logger.info(obj)

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      const parsed = JSON.parse(logs[0].message)
      expect(parsed).toEqual(obj)
    })

    test('handles JSON formatter output', async () => {
      const logger = new Logger('test', { format: 'json' })
      await logger.initialize()
      logger.info('test message')

      const logs = await logManager.getLogs({})
      expect(logs.length).toBe(1)
      // The message itself is not JSON, but rather a raw string
      expect(logs[0].message).toBe('test message')
      expect(logs[0].level).toBe('info')
      expect(logs[0].name).toBe('test')
    })

    test('respects color settings in text formatter', async () => {
      // Test with colors enabled
      const colorLogger = new Logger('test', { format: 'text', colors: true })
      await colorLogger.initialize()
      const colorOutput = await (colorLogger as any).formatter.format({
        timestamp: new Date(),
        level: 'info',
        name: 'test',
        message: 'colored message',
      })

      // Test with colors disabled
      const noColorLogger = new Logger('test', { format: 'text', colors: false })
      await noColorLogger.initialize()
      const plainOutput = await (noColorLogger as any).formatter.format({
        timestamp: new Date(),
        level: 'info',
        name: 'test',
        message: 'plain message',
      })

      // The colored output should contain ANSI escape codes
      expect(colorOutput).toContain('\x1B[')
      // The plain output should not contain ANSI escape codes
      expect(plainOutput).not.toContain('\x1B[')
    })
  })
})

// describe('Logger', () => {
//   describe('Performance Tracking', () => {
//     test('tracks operation duration', async () => {
//       const logger = new Logger('performance')
//       const end = logger.info('start operation')

//       // Simulate some work
//       await new Promise(resolve => setTimeout(resolve, 100))

//       end('end operation')
//       expect(true).toBe(true) // TODO: verify duration was logged
//     })
//   })

//   describe('Domain-specific Logging', () => {
//     test('creates extended logger', () => {
//       const logger = new Logger('parent')
//       const child = logger.extend('child')
//       expect(child).toBeTruthy()
//     })

//     test('logs with correct namespace', () => {
//       const logger = new Logger('parent')
//       const child = logger.extend('child')
//       child.info('test message')
//       expect(true).toBe(true) // TODO: verify namespace
//     })
//   })

//   describe('Format Strings', () => {
//     test('formats string with number', () => {
//       const logger = new Logger('test')
//       logger.info('count: %d', 42)
//       expect(true).toBe(true) // TODO: verify formatted message
//     })

//     test('formats string with multiple values', () => {
//       const logger = new Logger('test')
//       logger.info('hello %s, count: %d', 'world', 42)
//       expect(true).toBe(true) // TODO: verify formatted message
//     })
//   })

//   describe('Conditional Logging', () => {
//     test('executes only callback when enabled', () => {
//       const logger = new Logger('test')
//       logger.only(() => {
//         logger.info('test message')
//       })
//       expect(true).toBe(true) // TODO: verify callback execution
//     })
//   })

//   describe('Environment Detection', () => {
//     test('detects server environment', () => {
//       const logger = new Logger('test')
//       logger.info('test message')
//       expect(true).toBe(true) // TODO: verify server output
//     })
//   })

//   describe('JsonFormatter', () => {
//     test('formats log entry as JSON', async () => {
//       const formatter = new JsonFormatter()
//       const output = await formatter.format(sampleEntry)
//       const parsed = JSON.parse(output)

//       expect(parsed).toEqual({
//         timestamp: '2024-02-01T12:34:56.789Z',
//         level: 'info',
//         name: 'test',
//         message: 'Hello world',
//         metadata: expect.any(Object),
//       })
//     })

//     test('includes metadata', async () => {
//       const formatter = new JsonFormatter()
//       const output = await formatter.format(sampleEntry)
//       const parsed = JSON.parse(output)

//       expect(parsed.metadata).toHaveProperty('pid')
//       expect(parsed.metadata).toHaveProperty('hostname')
//       expect(parsed.metadata).toHaveProperty('environment')
//     })

//     test('handles object messages', async () => {
//       const formatter = new JsonFormatter()
//       const entry = {
//         ...sampleEntry,
//         message: { key: 'value' },
//       }
//       const output = await formatter.format(entry)
//       const parsed = await JSON.parse(output)

//       expect(parsed.message).toEqual({ key: 'value' })
//     })
//   })

//   describe('Format Selection', () => {
//     test('uses JSON in production', () => {
//       process.env.NODE_ENV = 'production'
//       const logger = new Logger('test')
//       logger.info('test message')
//       // TODO: verify JSON output
//       expect(true).toBe(true)
//     })

//     test('uses text in development', () => {
//       process.env.NODE_ENV = 'development'
//       const logger = new Logger('test')
//       logger.info('test message')
//       // TODO: verify text output
//       expect(true).toBe(true)
//     })

//     test('respects format option', () => {
//       const logger = new Logger('test', { format: 'json' })
//       logger.info('test message')
//       // TODO: verify JSON output
//       expect(true).toBe(true)
//     })
//   })
// })

// describe('Time-based Log Rotation', () => {
//   const TEST_LOG_DIR = join(homedir(), '.clarity-test', 'logs')
//   let currentTime: Date
//   // Mock Date
//   const RealDate = globalThis.Date

//   beforeEach(async () => {
//     await mkdir(TEST_LOG_DIR, { recursive: true })
//     await configManager.set('logDirectory', TEST_LOG_DIR)
//     currentTime = new Date('2024-02-01T12:00:00.000Z')

//     globalThis.Date = class extends RealDate {
//       constructor(...args: any[]) {
//         if (args.length === 0) {
//           return new RealDate(currentTime)
//         }
//         return new RealDate(...args)
//       }
//     } as any
//     globalThis.Date.now = () => currentTime.getTime()
//   })

//   afterEach(async () => {
//     try {
//       await rm(TEST_LOG_DIR, { recursive: true })
//       globalThis.Date = RealDate
//     }
//     catch (error) {
//       console.error('Error cleaning up:', error)
//     }
//   })

//   describe('Daily Rotation', () => {
//     test('rotates logs at specified hour', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       // Write some logs
//       logger.info('before rotation')

//       // Move time to next day
//       currentTime = new Date('2024-02-02T00:00:00.000Z')

//       logger.info('after rotation')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(2) // Original + rotated
//     })

//     test('respects custom rotation time', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 14,
//           rotateMinute: 30,
//         },
//       })

//       logger.info('before rotation')
//       currentTime = new Date('2024-02-01T14:30:00.000Z')
//       logger.info('after rotation')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(2)
//     })
//   })

//   describe('Weekly Rotation', () => {
//     test('rotates logs on specified day of week', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'weekly',
//           rotateDayOfWeek: 0, // Sunday
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       logger.info('before rotation')
//       currentTime = new Date('2024-02-04T00:00:00.000Z') // Sunday
//       logger.info('after rotation')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(2)
//     })

//     test('handles week boundary correctly', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'weekly',
//           rotateDayOfWeek: 0,
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       logger.info('before rotation')
//       currentTime = new Date('2024-02-04T00:00:00.000Z')
//       logger.info('during week')
//       currentTime = new Date('2024-02-11T00:00:00.000Z')
//       logger.info('next week')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(3)
//     })
//   })

//   describe('Monthly Rotation', () => {
//     test('rotates logs on specified day of month', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'monthly',
//           rotateDayOfMonth: 1,
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       logger.info('before rotation')
//       currentTime = new Date('2024-03-01T00:00:00.000Z')
//       logger.info('after rotation')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(2)
//     })

//     test('handles month boundary correctly', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'monthly',
//           rotateDayOfMonth: 1,
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       logger.info('before rotation')
//       currentTime = new Date('2024-03-01T00:00:00.000Z')
//       logger.info('next month')
//       currentTime = new Date('2024-04-01T00:00:00.000Z')
//       logger.info('another month')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(3)
//     })
//   })

//   describe('Mixed Rotation Triggers', () => {
//     test('handles both size and time triggers', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 0,
//           rotateMinute: 0,
//           maxSize: 100, // Small size to trigger size rotation
//         },
//       })

//       // Trigger size rotation
//       for (let i = 0; i < 10; i++) {
//         logger.info('size rotation test '.repeat(3))
//       }

//       // Trigger time rotation
//       currentTime = new Date('2024-02-02T00:00:00.000Z')
//       logger.info('time rotation test')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBeGreaterThan(2)
//     })

//     test('preserves logs across rotation types', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 0,
//           rotateMinute: 0,
//           maxSize: 100,
//         },
//       })

//       logger.info('first log')

//       // Trigger size rotation
//       for (let i = 0; i < 5; i++) {
//         logger.info('test message '.repeat(5))
//       }

//       // Trigger time rotation
//       currentTime = new Date('2024-02-02T00:00:00.000Z')
//       logger.info('last log')

//       const allLogs = await logManager.getLogs({})
//       expect(allLogs.some(log => log.message === 'first log')).toBe(true)
//       expect(allLogs.some(log => log.message === 'last log')).toBe(true)
//     })
//   })

//   describe('Edge Cases', () => {
//     test('handles leap years in monthly rotation', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'monthly',
//           rotateDayOfMonth: 29,
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       currentTime = new Date('2024-02-28T23:59:59.999Z')
//       logger.info('before leap day')
//       currentTime = new Date('2024-02-29T00:00:00.000Z')
//       logger.info('on leap day')
//       currentTime = new Date('2024-03-29T00:00:00.000Z')
//       logger.info('next month')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(3)
//     })

//     test('handles daylight saving time transitions', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 2, // Common DST transition hour
//           rotateMinute: 0,
//         },
//       })

//       // Test during DST transition
//       currentTime = new Date('2024-03-10T07:59:59.999Z') // Just before DST
//       logger.info('before DST')
//       currentTime = new Date('2024-03-10T08:00:00.000Z') // After DST
//       logger.info('after DST')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBe(2)
//     })

//     test('handles invalid rotation dates', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'monthly',
//           rotateDayOfMonth: 31, // Not all months have 31 days
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       currentTime = new Date('2024-03-31T00:00:00.000Z')
//       logger.info('31-day month')
//       currentTime = new Date('2024-04-30T23:59:59.999Z')
//       logger.info('30-day month')
//       currentTime = new Date('2024-05-01T00:00:00.000Z')
//       logger.info('next month')

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.length).toBeGreaterThan(1)
//     })
//   })

//   describe('CLI Integration', () => {
//     test('configures time-based rotation via CLI', async () => {
//       await handleConfig({
//         action: 'set',
//         key: 'rotation.frequency',
//         value: 'daily',
//       })
//       await handleConfig({
//         action: 'set',
//         key: 'rotation.rotateHour',
//         value: '0',
//       })

//       const config = await configManager.list()
//       expect(config.rotation?.frequency).toBe('daily')
//       expect(config.rotation?.rotateHour).toBe(0)
//     })

//     test('watch command observes time-based rotation', async () => {
//       const logger = new Logger('test', {
//         rotation: {
//           frequency: 'daily',
//           rotateHour: 0,
//           rotateMinute: 0,
//         },
//       })

//       const logs: string[] = []
//       const originalLog = console.log
//       console.log = (msg: string) => logs.push(msg)

//       try {
//         const watchPromise = handleWatch({
//           level: 'info',
//           name: 'test',
//         })

//         logger.info('before rotation')
//         currentTime = new Date('2024-02-02T00:00:00.000Z')
//         logger.info('after rotation')

//         await new Promise(resolve => setTimeout(resolve, 100))
//         expect(logs.length).toBe(2)
//       }
//       finally {
//         console.log = originalLog
//       }
//     })
//   })
// })
