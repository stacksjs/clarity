import type { LogEntry } from '../src/types'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { Readable } from 'node:stream'

/**
 * Time manipulation utilities
 */
export class TimeHelper {
  private originalNow: typeof Date.now
  private mockedTime: number

  constructor() {
    this.originalNow = Date.now
    this.mockedTime = Date.now()
  }

  mockTime(): void {
    Date.now = () => this.mockedTime
  }

  advance(ms: number): void {
    this.mockedTime += ms
  }

  restore(): void {
    Date.now = this.originalNow
  }
}

/**
 * File system mocks
 */
export class FSHelper {
  private files: Map<string, Buffer>

  constructor() {
    this.files = new Map()
  }

  writeFile(path: string, data: Buffer | string): void {
    this.files.set(path, Buffer.from(data))
  }

  readFile(path: string): Buffer {
    const data = this.files.get(path)
    if (!data)
      throw new Error(`File not found: ${path}`)
    return data
  }

  exists(path: string): boolean {
    return this.files.has(path)
  }

  delete(path: string): void {
    this.files.delete(path)
  }

  clear(): void {
    this.files.clear()
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

  mockEnv(env: Record<string, string>): void {
    process.env = { ...env }
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
