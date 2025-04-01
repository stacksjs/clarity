import type { Logger } from '@stacksjs/clarity'
import type { LogEntry } from '../src/types'
import { Buffer } from 'node:buffer'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { Readable } from 'node:stream'

/**
 * Time manipulation utilities
 */
export class TimeHelper {
  private originalNow: typeof Date.now
  private originalDate: typeof Date
  private currentTime: number

  constructor() {
    this.originalNow = Date.now
    this.originalDate = Date
    this.currentTime = Date.now()

    // Override Date.now
    Date.now = () => this.currentTime

    // Override Date constructor
    const currentTime = this.currentTime
    // @ts-expect-error - we need to override the Date constructor
    globalThis.Date = class extends Date {
      constructor(...args: ConstructorParameters<typeof Date>) {
        super(args.length ? args[0] : currentTime)
      }
    }
  }

  setCurrentTime(date: Date): void {
    this.currentTime = date.getTime()
  }

  advanceTime(ms: number): void {
    this.currentTime += ms
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  restore(): void {
    Date.now = this.originalNow
    globalThis.Date = this.originalDate
  }
}

/**
 * File system mocks
 */
export class FSHelper {
  private logs: Map<string, string> = new Map()
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  clear(): void {
    this.logs.clear()
  }

  async getLogContents(): Promise<string> {
    const files = await this.getLogFiles()
    let contents = ''

    for (const file of files) {
      const fileContents = await readFile(file) // Read as buffer
      const lines = fileContents.toString().split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          let processedLine: string
          if (line.startsWith('RAW: ')) {
            processedLine = line.substring(5) // Remove RAW: prefix
          }
          else {
            try {
              // Try to decode as base64 first
              const encryptedBuffer = Buffer.from(line, 'base64')
              // eslint-disable-next-line no-console
              console.log('Encrypted buffer: ', encryptedBuffer)
              processedLine = await this.logger.decrypt(encryptedBuffer)
            }
            catch (error) {
              // If base64 decoding or decryption fails, use raw line
              console.error('Error decrypting log data:', error)
              processedLine = line
            }
          }

          // Extract message after timestamp and logger name
          const parts = processedLine.split('[test]')
          if (parts.length > 1) {
            const timestamp = parts[0].trim()
            const afterTest = parts[1].trim()
            const message = afterTest.split(' ').slice(1).join(' ').trim()
            if (message) {
              contents += `${timestamp}  ${message}\n`
            }
          }
          else {
            // If the line doesn't contain [test], just add it as is
            contents += `${processedLine}\n`
          }
        }
        catch (error) {
          console.error('Error processing line:', error)
          // Skip lines that can't be processed
          continue
        }
      }
    }

    return contents.trim()
  }

  async getLogFiles(): Promise<string[]> {
    console.error('Looking for log files in directory:', this.logger.getLogDirectory())
    const files = await readdir(this.logger.getLogDirectory())
    console.error('Found files:', files)
    const fullPaths = files.map(file => join(this.logger.getLogDirectory(), file))
    console.error('Full paths:', fullPaths)
    return fullPaths
  }

  async getRawLogContents(): Promise<string> {
    console.error('getRawLogContents called')
    const files = await this.getLogFiles()
    console.error('Found log files:', files)
    let contents = ''

    for (const file of files) {
      const fileContents = await readFile(file, 'utf-8')
      console.error('File content length:', fileContents.length)
      contents += fileContents
    }

    console.error('Total raw contents length:', contents.length)
    console.error('Raw log contents:', contents)
    return contents
  }

  async decryptLogContents(): Promise<string> {
    return this.getLogContents()
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  static createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
    return {
      timestamp: new Date(),
      level: 'info',
      message: 'Test message',
      name: 'test-logger',
      ...overrides,
    }
  }

  static createLogEntries(count: number): LogEntry[] {
    return Array.from({ length: count }, (_, i) => this.createLogEntry({
      message: `Test message ${i}`,
    }))
  }

  static createLargeLogEntry(sizeInKb: number): LogEntry {
    return this.createLogEntry({
      message: 'x'.repeat(sizeInKb * 1024),
    })
  }
}

/**
 * Encryption assertion helpers
 */
export class EncryptionHelper {
  static isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      return !!(parsed.iv && parsed.data)
    }
    catch {
      return false
    }
  }

  static createEncryptedData(content: string): string {
    return JSON.stringify({
      iv: 'mock-iv',
      data: Buffer.from(content).toString('base64'),
    })
  }
}

/**
 * Stream testing utilities
 */
export class StreamHelper {
  static createReadStream(data: string[]): Readable {
    return Readable.from(data)
  }

  static async streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  static createMockStream(): Readable {
    return new Readable({
      read() {
        this.push('test data\n')
        this.push(null)
      },
    })
  }
}

/**
 * Mock process helper
 */
export class ProcessHelper {
  private originalEnv: NodeJS.ProcessEnv

  constructor() {
    this.originalEnv = { ...process.env }
  }

  setEnv(key: string, value: string): void {
    process.env[key] = value
  }

  restore(): void {
    process.env = this.originalEnv
  }
}

/**
 * Performance testing helper
 */
export class PerformanceHelper {
  static async measureExecution(fn: () => Promise<void>): Promise<number> {
    const start = performance.now()
    await fn()
    return performance.now() - start
  }
}

// Helper function for appendFile
export async function appendFile(file: string, data: string): Promise<void> {
  const { appendFile } = await import('node:fs/promises')
  return appendFile(file, data)
}
