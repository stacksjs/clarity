import type { ClarityConfig, EncryptionConfig, Formatter, LogEntry, LogLevel } from './types'
import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream/promises'
import { createGunzip, createGzip } from 'node:zlib'
import { config as defaultConfig } from './config'
import { JsonFormatter } from './formatters/json'
import { TextFormatter } from './formatters/text'
import { chunk, isBrowserProcess, isServerProcess } from './utils'

interface EncryptionOptions {
  algorithm?: 'aes-256-cbc' | 'aes-256-gcm' | 'chacha20-poly1305'
  keyId?: string
  compress?: boolean
}

// interface KeyRotationConfig {
//   enabled: boolean
//   interval: number // in days
//   maxKeys: number
// }

interface FingersCrossedConfig {
  activationLevel: LogLevel
  bufferSize: number
  flushOnDeactivation: boolean
  stopBuffering: boolean
}

const defaultFingersCrossedConfig: FingersCrossedConfig = {
  activationLevel: 'error',
  bufferSize: 50,
  flushOnDeactivation: true,
  stopBuffering: false,
}

export type BunTimer = ReturnType<typeof setTimeout>

export class Logger {
  private name: string
  private config: ClarityConfig
  private timers: Map<string, number>
  private subLoggers: Map<string, Logger>
  private formatter: Formatter
  private currentLogFile: string
  private rotationTimeout?: BunTimer
  private keyRotationTimeout?: BunTimer
  private encryptionKeys: Map<string, { key: Buffer, createdAt: Date }>
  private logBuffer: LogEntry[] = []
  private isActivated: boolean = false
  private fingersCrossedConfig?: FingersCrossedConfig

  constructor(name: string, options: Partial<ClarityConfig & { fingersCrossed?: boolean | Partial<FingersCrossedConfig> }> = {}) {
    this.name = name
    this.config = { ...defaultConfig, ...options }
    this.timers = new Map()
    this.subLoggers = new Map()
    this.formatter = this.config.format === 'json'
      ? new JsonFormatter()
      : new TextFormatter(this.config)
    this.currentLogFile = this.generateLogFilename()
    this.encryptionKeys = new Map()

    if (this.config.rotation && typeof this.config.rotation !== 'boolean') {
      this.setupRotation()
      if (this.config.rotation.encrypt && typeof this.config.rotation.encrypt === 'object'
        && this.config.rotation.keyRotation?.enabled) {
        this.setupKeyRotation()
      }
    }

    if (options.fingersCrossed) {
      this.fingersCrossedConfig = {
        ...defaultFingersCrossedConfig,
        ...(typeof options.fingersCrossed === 'object' ? options.fingersCrossed : {}),
      }
    }
  }

  private setupKeyRotation(): void {
    if (typeof this.config.rotation === 'boolean')
      return
    const keyRotation = this.config.rotation.keyRotation
    if (!keyRotation?.enabled)
      return

    // Generate initial key
    const initialKeyId = this.generateKeyId()
    this.encryptionKeys.set(initialKeyId, {
      key: this.generateKey(),
      createdAt: new Date(),
    })

    // Setup key rotation interval
    const interval = keyRotation.interval * 24 * 60 * 60 * 1000
    this.keyRotationTimeout = setInterval(() => {
      this.rotateKeys()
    }, interval)
  }

  private async rotateKeys(): Promise<void> {
    if (typeof this.config.rotation === 'boolean')
      return
    const keyRotation = this.config.rotation.keyRotation
    if (!keyRotation?.enabled)
      return

    // Generate new key
    const newKeyId = this.generateKeyId()
    this.encryptionKeys.set(newKeyId, {
      key: this.generateKey(),
      createdAt: new Date(),
    })

    // Remove old keys if we exceed maxKeys
    const sortedKeys = Array.from(this.encryptionKeys.entries())
      .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime())

    if (sortedKeys.length > keyRotation.maxKeys) {
      for (const [keyId] of sortedKeys.slice(keyRotation.maxKeys))
        this.encryptionKeys.delete(keyId)
    }
  }

  private generateKeyId(): string {
    return randomBytes(16).toString('hex')
  }

  private generateKey(): Buffer {
    return randomBytes(32)
  }

  private getEncryptionOptions(): EncryptionConfig {
    if (!this.config.rotation || typeof this.config.rotation === 'boolean'
      || this.config.rotation.encrypt === false) {
      return {}
    }

    const defaultOptions: EncryptionConfig = {
      algorithm: 'aes-256-cbc',
      compress: false,
    }

    if (typeof this.config.rotation.encrypt === 'object') {
      // Type guard to ensure we're working with EncryptionConfig
      const encryptConfig: EncryptionConfig = this.config.rotation.encrypt
      return {
        ...defaultOptions,
        ...encryptConfig,
      }
    }

    return defaultOptions
  }

  private async compressData(data: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = []
      const gzip = createGzip()

      gzip.on('data', (chunk: Uint8Array) => chunks.push(chunk))
      gzip.on('end', () => resolve(Buffer.from(Buffer.concat(chunks))))
      gzip.on('error', reject)

      gzip.end(data)
    })
  }

  private async decompressData(data: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = []
      const gunzip = createGunzip()

      gunzip.on('data', (chunk: Uint8Array) => chunks.push(chunk))
      gunzip.on('end', () => resolve(Buffer.from(Buffer.concat(chunks))))
      gunzip.on('error', reject)

      gunzip.end(data)
    })
  }

  private getCurrentKey(): { key: Buffer, id: string } {
    if (this.encryptionKeys.size === 0) {
      const id = this.generateKeyId()
      const key = this.generateKey()
      this.encryptionKeys.set(id, { key, createdAt: new Date() })
      return { key, id }
    }

    // Get the newest key
    const [id, { key }] = Array.from(this.encryptionKeys.entries())
      .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime())[0]

    return { key, id }
  }

  private generateLogFilename(): string {
    const date = new Date().toISOString().split('T')[0]
    return join(
      this.config.logDirectory,
      `${this.name}-${date}.log`,
    )
  }

  private getLevelValue(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      success: 2,
      warning: 3,
      error: 4,
    }
    return levels[level]
  }

  private shouldActivateFingersCrossed(level: LogLevel): boolean {
    if (!this.fingersCrossedConfig)
      return false

    return this.getLevelValue(level) >= this.getLevelValue(this.fingersCrossedConfig.activationLevel)
  }

  private async handleFingersCrossedBuffer(level: LogLevel, formattedEntry: string): Promise<void> {
    if (!this.fingersCrossedConfig)
      return

    if (this.shouldActivateFingersCrossed(level) && !this.isActivated) {
      this.isActivated = true

      // Write all buffered entries
      for (const entry of this.logBuffer) {
        const formattedBufferedEntry = await this.formatter.format(entry)
        await this.writeToFile(formattedBufferedEntry)
        // eslint-disable-next-line no-console
        console.log(formattedBufferedEntry)
      }

      // Clear buffer if stopBuffering is true
      if (this.fingersCrossedConfig.stopBuffering)
        this.logBuffer = []
    }

    if (this.isActivated) {
      // Direct write when activated
      await this.writeToFile(formattedEntry)
      // eslint-disable-next-line no-console
      console.log(formattedEntry)
    }
    else {
      // Buffer the entry
      if (this.logBuffer.length >= this.fingersCrossedConfig.bufferSize)
        this.logBuffer.shift() // Remove oldest entry

      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message: formattedEntry,
        name: this.name,
      }
      this.logBuffer.push(entry)
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.config.rotation || typeof this.config.rotation === 'boolean' || !this.config.rotation.encrypt)
      return data

    let processedData = Buffer.from(data, 'utf8')
    const encryptConfig = typeof this.config.rotation.encrypt === 'object' ? this.config.rotation.encrypt : {}

    // Handle compression if enabled
    if (encryptConfig.compress)
      processedData = Buffer.from(await this.compressData(processedData))

    const key = this.getEncryptionKey()
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    const encrypted = Buffer.concat([
      cipher.update(processedData),
      cipher.final(),
    ])

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted.toString('base64'),
      compressed: encryptConfig.compress || false,
    })
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.config.rotation || typeof this.config.rotation === 'boolean' || !this.config.rotation.encrypt)
      return encryptedData

    try {
      const { iv, data, compressed } = JSON.parse(encryptedData)
      const key = this.getEncryptionKey()

      const decipher = createDecipheriv(
        'aes-256-cbc',
        key,
        Buffer.from(iv, 'hex'),
      )

      let decrypted = Buffer.concat([
        decipher.update(Buffer.from(data, 'base64')),
        decipher.final(),
      ])

      // Handle decompression if the data was compressed
      if (compressed)
        decrypted = Buffer.from(await this.decompressData(decrypted))

      return decrypted.toString('utf8')
    }
    catch (error) {
      throw new Error(`Failed to decrypt log data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async rotateLog(): Promise<void> {
    if (isBrowserProcess())
      return

    const stats = await stat(this.currentLogFile).catch(() => null)
    if (!stats)
      return

    const config = this.config.rotation
    if (typeof config === 'boolean')
      return

    // Check file size rotation
    if (config.maxSize && stats.size >= config.maxSize) {
      const newFile = this.generateLogFilename()
      this.currentLogFile = newFile

      // Cleanup old files if maxFiles is set
      if (config.maxFiles) {
        const files = await readdir(this.config.logDirectory)
        const logFiles = files
          .filter(f => f.startsWith(this.name))
          .sort((a, b) => b.localeCompare(a))

        for (const file of logFiles.slice(config.maxFiles)) {
          await unlink(join(this.config.logDirectory, file))
        }
      }
    }
  }

  private setupRotation(): void {
    if (isBrowserProcess())
      return
    if (typeof this.config.rotation === 'boolean')
      return

    const config = this.config.rotation
    let interval: number

    switch (config.frequency) {
      case 'hourly':
        interval = 60 * 60 * 1000
        break
      case 'daily':
        interval = 24 * 60 * 60 * 1000
        break
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000
        break
      case 'monthly':
        interval = 30 * 24 * 60 * 60 * 1000
        break
      default:
        return
    }

    this.rotationTimeout = setInterval(() => {
      void this.rotateLog()
    }, interval)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      success: 2,
      warning: 3,
      error: 4,
    }
    return levels[level] >= levels[this.config.level]
  }

  private async writeToFile(formattedEntry: string): Promise<void> {
    if (isBrowserProcess())
      return

    const isServer = await isServerProcess()
    if (!isServer)
      return

    await mkdir(this.config.logDirectory, { recursive: true })

    const encryptedData = await this.encrypt(formattedEntry)
    await writeFile(this.currentLogFile, `${encryptedData}\n`, { flag: 'a' })

    void this.rotateLog()
  }

  private async log(level: LogLevel, message: string, ...args: any[]): Promise<(() => void) | void> {
    if (!this.shouldLog(level))
      return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      args,
      name: this.name,
    }

    const formattedEntry = await this.formatter.format(entry)

    // Handle fingers crossed logging if enabled
    if (this.fingersCrossedConfig) {
      await this.handleFingersCrossedBuffer(level, formattedEntry)
      return
    }

    // For performance tracking
    if (level === 'info') {
      const timerId = Math.random().toString(36).slice(2)
      this.timers.set(timerId, performance.now())

      // eslint-disable-next-line no-console
      console.log(formattedEntry)
      void this.writeToFile(formattedEntry)

      return () => {
        const startTime = this.timers.get(timerId)
        if (startTime) {
          const duration = performance.now() - startTime
          this.timers.delete(timerId)
          void this.log('info', `${message} (${duration.toFixed(2)}ms)`, ...args)
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(formattedEntry)
    void this.writeToFile(formattedEntry)
  }

  debug(message: string, ...args: any[]): void {
    void this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]): Promise<(() => void) | void> {
    return this.log('info', message, ...args)
  }

  success(message: string, ...args: any[]): void {
    void this.log('success', message, ...args)
  }

  warning(message: string, ...args: any[]): void {
    void this.log('warning', message, ...args)
  }

  error(message: string, ...args: any[]): void {
    void this.log('error', message, ...args)
  }

  extend(namespace: string): Logger {
    const subLoggerName = `${this.name}:${namespace}`

    if (!this.subLoggers.has(subLoggerName)) {
      this.subLoggers.set(
        subLoggerName,
        new Logger(subLoggerName, this.config),
      )
    }

    return this.subLoggers.get(subLoggerName)!
  }

  only(fn: () => void): void {
    if (process.env.DEBUG?.includes(this.name) || process.env.DEBUG === '*')
      fn()
  }

  private getEncryptionKey(): Buffer {
    return Buffer.from(
      createHash('sha256')
        .update(String(process.env.LOG_ENCRYPTION_KEY || 'default-key'))
        .digest('base64')
        .slice(0, 32),
    )
  }

  async readLog(filePath: string): Promise<LogEntry[]> {
    const content = await readFile(filePath, 'utf8')
    const entries: LogEntry[] = []

    for (const line of content.split('\n').filter(Boolean)) {
      try {
        const decrypted = await this.decrypt(line)
        const entry = JSON.parse(decrypted)

        // Restore Date object from ISO string
        entry.timestamp = new Date(entry.timestamp)

        entries.push(entry)
      }
      catch (error) {
        console.error(`Failed to parse log entry: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return entries
  }

  async readLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    if (isBrowserProcess())
      return []

    try {
      const files = await readdir(this.config.logDirectory)
      const logFiles = files
        .filter(f => f.startsWith(this.name))
        .sort((a, b) => b.localeCompare(a))

      const allEntries: LogEntry[] = []

      for (const file of logFiles) {
        const entries = await this.readLog(join(this.config.logDirectory, file))

        const filteredEntries = entries.filter((entry) => {
          const timestamp = entry.timestamp.getTime()
          return timestamp >= startDate.getTime() && timestamp <= endDate.getTime()
        })

        allEntries.push(...filteredEntries)
      }

      return allEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }
    catch (error) {
      console.error(`Failed to read logs: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  async readBatch(
    filePaths: string[],
    options: {
      batchSize?: number
      parallel?: boolean
      filter?: (entry: LogEntry) => boolean
    } = {},
  ): Promise<LogEntry[]> {
    const {
      batchSize = 1000,
      parallel = true,
      filter = () => true,
    } = options

    const entries: LogEntry[] = []

    if (parallel) {
      const batches = chunk(filePaths, batchSize)
      for (const batch of batches) {
        const batchEntries = await Promise.all(
          batch.map((filePath: string) => this.readLog(filePath)),
        )
        entries.push(...batchEntries.flat().filter(filter))
      }
    }
    else {
      for (const filePath of filePaths) {
        const fileEntries = await this.readLog(filePath)
        entries.push(...fileEntries.filter(filter))

        if (entries.length >= batchSize)
          break
      }
    }

    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  async *streamLogs(filePath: string, options: {
    bufferSize?: number
    decryption?: boolean
  } = {}): AsyncGenerator<LogEntry> {
    const {
      bufferSize = 64 * 1024, // 64KB buffer
      decryption = true,
    } = options

    const readStream = createReadStream(filePath, {
      encoding: 'utf8',
      highWaterMark: bufferSize,
    })

    let incomplete = ''

    for await (const chunk of readStream) {
      const lines = (incomplete + chunk).split('\n')
      incomplete = lines.pop() || '' // Save the last incomplete line

      for (const line of lines) {
        if (!line.trim())
          continue

        try {
          const decrypted = decryption ? await this.decrypt(line) : line
          const entry = JSON.parse(decrypted)
          entry.timestamp = new Date(entry.timestamp)
          yield entry
        }
        catch (error) {
          console.error(`Failed to parse log entry: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    // Handle last line if complete
    if (incomplete.trim()) {
      try {
        const decrypted = decryption ? await this.decrypt(incomplete) : incomplete
        const entry = JSON.parse(decrypted)
        entry.timestamp = new Date(entry.timestamp)
        yield entry
      }
      catch (error) {
        console.error(`Failed to parse last log entry: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  async compressLogFile(inputPath: string, outputPath: string): Promise<void> {
    const readStream = createReadStream(inputPath)
    const writeStream = createWriteStream(outputPath)
    const gzip = createGzip()

    await pipeline(readStream, gzip, writeStream)
  }

  async reEncryptLogFile(
    inputPath: string,
    outputPath: string,
    newOptions: EncryptionOptions,
  ): Promise<void> {
    const entries = await this.readLog(inputPath)
    const writeStream = createWriteStream(outputPath)

    try {
      // Save current encryption options
      const currentRotation = this.config.rotation
      if (typeof currentRotation !== 'boolean' && currentRotation.encrypt) {
        const previousOptions = currentRotation.encrypt
        // Apply new encryption options
        currentRotation.encrypt = newOptions

        // Write all entries with new encryption
        for (const entry of entries) {
          const formattedEntry = await this.formatter.format(entry)
          const encrypted = await this.encrypt(formattedEntry)
          await new Promise<void>((resolve, reject) => {
            writeStream.write(`${encrypted}\n`, (error) => {
              if (error)
                reject(error)
              else
                resolve()
            })
          })
        }

        // Restore previous encryption options
        currentRotation.encrypt = previousOptions
      }
    }
    finally {
      // Ensure stream is closed even if an error occurs
      await new Promise<void>(resolve => writeStream.end(resolve))
    }
  }

  async validateEncryption(filePath: string): Promise<{
    isValid: boolean
    errors: Array<{ line: number, error: string }>
  }> {
    const errors: Array<{ line: number, error: string }> = []
    let lineNumber = 0

    for await (const entry of this.streamLogs(filePath)) {
      lineNumber++
      try {
        // Attempt to decrypt and parse each entry
        const formattedEntry = await this.formatter.format(entry)
        await this.encrypt(formattedEntry) // Test encryption
        await this.decrypt(formattedEntry) // Test decryption
      }
      catch (error) {
        errors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  deactivateFingersCrossed(): void {
    if (!this.fingersCrossedConfig || !this.isActivated)
      return

    this.isActivated = false

    if (this.fingersCrossedConfig.flushOnDeactivation) {
      // Write any remaining buffered entries
      this.logBuffer.forEach((entry) => {
        void this.formatter.format(entry).then((formattedEntry) => {
          void this.writeToFile(formattedEntry)
          // eslint-disable-next-line no-console
          console.log(formattedEntry)
        })
      })
    }

    this.logBuffer = []
  }

  getBufferedLogs(): LogEntry[] {
    return [...this.logBuffer]
  }

  clearBuffer(): void {
    this.logBuffer = []
  }

  isFingersCrossedActive(): boolean {
    return this.isActivated
  }

  destroy(): void {
    if (this.rotationTimeout)
      clearInterval(this.rotationTimeout)

    if (this.keyRotationTimeout)
      clearInterval(this.keyRotationTimeout)
  }
}
