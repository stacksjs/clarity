// /* eslint-disable no-console */
// import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
// import { chmod, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
// import { homedir } from 'node:os'
// import { join } from 'node:path'
// import { handleConfig } from '../src/cli/config-handler'
// import { handleClear, handleExport, handleSearch, handleTail, handleWatch } from '../src/cli/handlers'
// import { JsonFormatter, TextFormatter } from '../src/formatters'
// import { Logger } from '../src/index'
// import { configManager } from '../src/storage/config-manager'
// import { logManager } from '../src/storage/log-manager'

// describe('CLI', () => {
//   const TEST_LOG_DIR = join(homedir(), '.clarity-test', 'logs')

//   beforeEach(async () => {
//     await mkdir(TEST_LOG_DIR, { recursive: true })
//     await configManager.set('logDirectory', TEST_LOG_DIR)
//     await logManager.initialize()
//   })

//   afterEach(async () => {
//     try {
//       await rm(TEST_LOG_DIR, { recursive: true })
//     }
//     catch (error) {
//       console.error('Error cleaning up test directory:', error)
//     }
//   })

//   test('watch command observes log rotation', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')
//     const logs: string[] = []

//     const originalLog = console.log

//     console.log = (msg: string) => logs.push(msg)

//     try {
//       const watchPromise = handleWatch({
//         level: 'info',
//         name: 'test',
//         json: false,
//         timestamp: true,
//       })

//       for (let i = 0; i < 5; i++) {
//         logger.info(`test message ${i}`)
//         await new Promise(resolve => setTimeout(resolve, 100))
//       }

//       await new Promise(resolve => setTimeout(resolve, 500))

//       expect(logs.length).toBe(5)
//       expect(logs.some(log => log.includes('test message 0'))).toBe(true)
//       expect(logs.some(log => log.includes('test message 4'))).toBe(true)
//     }
//     finally {
//       console.log = originalLog
//     }
//   })

//   test('export command handles rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')
//     const outputFile = join(TEST_LOG_DIR, 'export.json')

//     for (let i = 0; i < 10; i++) {
//       logger.info(`test message ${i}`)
//     }

//     await handleExport({
//       format: 'json',
//       output: outputFile,
//     })

//     const content = await readFile(outputFile, 'utf-8')
//     const exported = JSON.parse(content)

//     expect(exported.length).toBe(10)
//     expect(exported[0]).toHaveProperty('message')
//     expect(exported[0]).toHaveProperty('timestamp')
//   })

//   test('tail command follows rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')
//     const logs: string[] = []

//     const originalLog = console.log

//     console.log = (msg: string) => logs.push(msg)

//     try {
//       const tailPromise = handleTail({
//         lines: 5,
//         follow: true,
//       })

//       for (let i = 0; i < 10; i++) {
//         logger.info(`test message ${i}`)
//         await new Promise(resolve => setTimeout(resolve, 100))
//       }

//       await new Promise(resolve => setTimeout(resolve, 500))

//       expect(logs.length).toBeGreaterThanOrEqual(5)
//       expect(logs[logs.length - 1]).toContain('test message 9')
//     }
//     finally {
//       console.log = originalLog
//     }
//   })

//   test('search command searches across rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')
//     const logs: string[] = []

//     const originalLog = console.log
//     console.log = (msg: string) => logs.push(msg)

//     try {
//       // Write some logs that will be rotated
//       for (let i = 0; i < 10; i++) {
//         logger.info(i % 2 === 0 ? 'error found' : 'success message')
//       }

//       await handleSearch('error', {
//         caseSensitive: false,
//       })

//       expect(logs.length).toBe(5) // Should find all 5 "error found" messages
//       logs.forEach((log) => {
//         expect(log).toContain('error found')
//       })
//     }
//     finally {
//       console.log = originalLog
//     }
//   })

//   test('clear command handles rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')

//     // Generate logs that will trigger rotation
//     for (let i = 0; i < 10; i++) {
//       logger.info(`test message ${i}`)
//     }

//     const beforeFiles = await readdir(TEST_LOG_DIR)
//     expect(beforeFiles.length).toBeGreaterThan(1) // Should have rotated files

//     await handleClear({})

//     const afterFiles = await readdir(TEST_LOG_DIR)
//     expect(afterFiles.length).toBe(1) // Should only have empty current log file
//   })

//   test('config command manages rotation settings', async () => {
//     await handleConfig({
//       action: 'set',
//       key: 'maxLogSize',
//       value: '5242880', // 5MB
//     })

//     await handleConfig({
//       action: 'set',
//       key: 'maxLogFiles',
//       value: '10',
//     })

//     const config = await configManager.list()
//     expect(config.maxLogSize).toBe(5242880)
//     expect(config.maxLogFiles).toBe(10)
//   })
// })

// describe('Log Rotation Edge Cases', () => {
//   const TEST_LOG_DIR = join(homedir(), '.clarity-test', 'logs')

//   beforeEach(async () => {
//     await mkdir(TEST_LOG_DIR, { recursive: true })
//     await configManager.set('logDirectory', TEST_LOG_DIR)
//     await logManager.initialize()
//   })

//   afterEach(async () => {
//     try {
//       await rm(TEST_LOG_DIR, { recursive: true })
//     }
//     catch (error) {
//       console.error('Error cleaning up test directory:', error)
//     }
//   })

//   test('handles very small file size limits', async () => {
//     await configManager.set('maxLogSize', 10) // Extremely small size
//     const logger = new Logger('test')

//     for (let i = 0; i < 5; i++) {
//       logger.info('test')
//     }

//     const files = await readdir(TEST_LOG_DIR)
//     expect(files.length).toBeGreaterThan(1)
//   })

//   test('handles compression failures gracefully', async () => {
//     await configManager.set('maxLogSize', 100)
//     await configManager.set('compressLogs', true)
//     const logger = new Logger('test')

//     // Mock gzip to fail
//     // eslint-disable-next-line ts/no-require-imports
//     const originalGzip = require('node:zlib').gzip
//     // eslint-disable-next-line ts/no-require-imports
//     require('node:zlib').gzip = (data: any, callback: any) => {
//       callback(new Error('Mock compression failure'))
//     }

//     try {
//       for (let i = 0; i < 5; i++) {
//         logger.info('test message')
//       }

//       const files = await readdir(TEST_LOG_DIR)
//       expect(files.some(f => f.endsWith('.log'))).toBe(true)
//     }
//     finally {
//       // eslint-disable-next-line ts/no-require-imports
//       require('node:zlib').gzip = originalGzip
//     }
//   })

//   test('handles concurrent writes during rotation', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')

//     // Write logs concurrently
//     await Promise.all(Array.from({ length: 10 }).map((_, i) =>
//       logger.info(`concurrent message ${i}`),
//     ))

//     const logs = await logManager.getLogs({})
//     expect(logs.length).toBe(10)
//     expect(new Set(logs.map(l => l.message)).size).toBe(10)
//   })

//   const TEST_LOG_FILE = join(TEST_LOG_DIR, 'current.log')

//   test('maintains file permissions after rotation', async () => {
//     await configManager.set('maxLogSize', 100)
//     const logger = new Logger('test')

//     // Set specific permissions on the log file
//     await chmod(TEST_LOG_FILE, 0o600)

//     logger.info('test message')
//     await new Promise(resolve => setTimeout(resolve, 100))

//     const stats = await stat(TEST_LOG_FILE)
//     expect((stats.mode & 0o777).toString(8)).toBe('600')
//   })
// })

// describe('Formatters with Rotation', () => {
//   test('JsonFormatter handles rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const formatter = new JsonFormatter()
//     const logger = new Logger('test', { format: 'json' })

//     for (let i = 0; i < 5; i++) {
//       logger.info(`test ${i}`)
//     }

//     const logs = await logManager.getLogs({})
//     for (const log of logs) {
//       const formatted = await formatter.format(log)
//       const parsed = JSON.parse(formatted)
//       expect(parsed).toHaveProperty('timestamp')
//       expect(parsed).toHaveProperty('message')
//       expect(parsed).toHaveProperty('metadata')
//     }
//   })

//   test('TextFormatter handles rotated files', async () => {
//     await configManager.set('maxLogSize', 100)
//     const formatter = new TextFormatter()
//     const logger = new Logger('test', { format: 'text' })

//     for (let i = 0; i < 5; i++) {
//       logger.info(`test ${i}`)
//     }

//     const logs = await logManager.getLogs({})
//     for (const log of logs) {
//       const formatted = await formatter.format(log)
//       expect(formatted).toContain('test')
//       expect(formatted).toContain('[test]')
//       expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/)
//     }
//   })
// })
