import type { CipherGCM, DecipherGCM } from 'node:crypto'
import type { Readable } from 'node:stream'
import type { ClarityConfig, EncryptionConfig, Formatter, LogEntry, LoggerOptions, LogLevel } from './types'
import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { appendFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
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
  readonly config: ClarityConfig
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
  private options: LoggerOptions

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name
    this.options = options

    // Handle config options
    const configOptions = { ...options }
    const hasTimestamp = options.timestamp !== undefined
    if (hasTimestamp) {
      delete configOptions.timestamp // Remove from config to avoid type error
    }

    this.config = {
      ...defaultConfig,
      ...configOptions,
      timestamp: hasTimestamp || defaultConfig.timestamp,
    }
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
    if (!keyRotation?.enabled || !keyRotation.interval || !keyRotation.maxKeys)
      return

    // Generate initial key
    const initialKeyId = this.generateKeyId()
    const timestamp = typeof this.config.timestamp === 'string' || typeof this.config.timestamp === 'number'
      ? new Date(this.config.timestamp)
      : new Date()

    this.encryptionKeys.set(initialKeyId, {
      key: this.generateKey(),
      createdAt: timestamp,
    })

    // Set up key rotation interval
    this.keyRotationTimeout = setInterval(() => {
      this.rotateKeys().catch((error) => {
        console.error('Error rotating keys:', error)
      })
    }, keyRotation.interval * 1000)
  }

  private async rotateKeys(): Promise<void> {
    if (typeof this.config.rotation === 'boolean')
      return
    const keyRotation = this.config.rotation.keyRotation
    if (!keyRotation?.enabled || !keyRotation.maxKeys)
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

  getCurrentKey(): { key: Buffer, id: string } {
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

  setEncryptionKey(id: string, key: Buffer): void {
    this.encryptionKeys.set(id, { key, createdAt: new Date() })
  }

  private getEncryptionOptions(): EncryptionConfig {
    if (!this.config.rotation || typeof this.config.rotation === 'boolean'
      || !this.config.rotation.encrypt) {
      return {}
    }

    const defaultOptions: EncryptionConfig = {
      algorithm: 'aes-256-cbc',
      compress: false,
    }

    if (typeof this.config.rotation.encrypt === 'object') {
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
      const chunks: Buffer[] = []
      const gzip = createGzip()

      gzip.on('data', (chunk: Buffer) => chunks.push(chunk))
      gzip.on('end', () => resolve(Buffer.concat(chunks)))
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

  private getEncryptionKey(): Buffer {
    console.error('Getting encryption key')
    const key = createHash('sha256')
      .update(String(process.env.LOG_ENCRYPTION_KEY || 'default-key'))
      .digest()
    console.error('Generated key length:', key.length)
    return key
  }

  private async encrypt(data: string): Promise<string> {
    const encryptConfig = this.getEncryptionOptions()
    if (!Object.keys(encryptConfig).length) {
      console.error('No encryption config, returning raw data')
      return data
    }

    // Process data - compress if configured
    let processedData = Buffer.from(data, 'utf8')
    if (encryptConfig.compress) {
      console.error('Compressing data before encryption')
      processedData = await this.compressData(processedData)
    }

    const { key, id } = this.getCurrentKey()
    console.error('Got encryption key, length:', key.length)
    const iv = randomBytes(16)
    const algorithm = encryptConfig.algorithm || 'aes-256-cbc'
    console.error('Using algorithm:', algorithm)

    try {
      const cipher = createCipheriv(algorithm, key, iv)
      let encrypted: Buffer

      if (algorithm === 'aes-256-gcm') {
        console.error('Using GCM encryption')
        const gcmCipher = cipher as CipherGCM
        encrypted = Buffer.concat([
          gcmCipher.update(processedData),
          gcmCipher.final(),
        ])
        const authTag = gcmCipher.getAuthTag()
        encrypted = Buffer.concat([encrypted, authTag])
      }
      else {
        console.error('Using CBC encryption')
        encrypted = Buffer.concat([
          cipher.update(processedData),
          cipher.final(),
        ])
      }

      const result = JSON.stringify({
        iv: iv.toString('hex'),
        data: encrypted.toString('base64'),
        compressed: encryptConfig.compress || false,
        algorithm,
        keyId: id,
      })
      console.error('Encrypted result length:', result.length)
      return result
    }
    catch (error) {
      console.error('Encryption error:', error)
      throw error
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    const encryptConfig = this.getEncryptionOptions()
    if (!Object.keys(encryptConfig).length) {
      console.error('encryption not configured, returning raw data')
      return encryptedData
    }

    try {
      const { iv, data, compressed, algorithm = 'aes-256-cbc', keyId } = JSON.parse(encryptedData)
      console.error('parsed encrypted data:', {
        iv,
        compressed,
        algorithm,
        keyId,
      })

      // Get the key used for encryption
      let key: Buffer
      if (keyId) {
        // Try to get the key from the rotation system
        const storedKey = this.encryptionKeys.get(keyId)
        if (storedKey) {
          key = storedKey.key
        }
        else {
          // If key not found, try current key as fallback
          const currentKey = this.getCurrentKey()
          key = currentKey.key
        }
      }
      else {
        // If no keyId, use current key
        const currentKey = this.getCurrentKey()
        key = currentKey.key
      }
      console.error('got encryption key')

      // Convert IV from hex to buffer
      const ivBuffer = Buffer.from(iv, 'hex')
      const encryptedBuffer = Buffer.from(data, 'base64')

      let decryptedBuffer: Buffer
      if (algorithm === 'aes-256-gcm') {
        console.error('using GCM decryption')
        console.error('encrypted buffer length:', encryptedBuffer.length)
        const authTagLength = 16
        console.error('auth tag length:', authTagLength)
        const encryptedContent = encryptedBuffer.subarray(0, encryptedBuffer.length - authTagLength)
        console.error('encrypted data length:', encryptedContent.length)
        const authTag = encryptedBuffer.subarray(encryptedBuffer.length - authTagLength)

        const decipher = createDecipheriv(algorithm, key, ivBuffer)
        decipher.setAuthTag(authTag)
        decryptedBuffer = Buffer.concat([
          decipher.update(encryptedContent),
          decipher.final(),
        ])
      }
      else {
        const decipher = createDecipheriv(algorithm, key, ivBuffer)
        decryptedBuffer = Buffer.concat([
          decipher.update(encryptedBuffer),
          decipher.final(),
        ])
      }

      console.error('decrypted buffer length:', decryptedBuffer.length)
      console.error('decrypted data')

      // Decompress if needed
      if (compressed) {
        console.error('decompressing data')
        decryptedBuffer = await this.decompressData(decryptedBuffer)
        console.error('decompressed buffer length:', decryptedBuffer.length)
      }

      const decryptedResult = decryptedBuffer.toString('utf8')
      console.error('decrypted result:', decryptedResult)

      // Extract message from log entry
      const match = decryptedResult.match(/\[test\]\s+([^\n]+)/)
      if (match) {
        console.error('Extracted message:', match[1])
      }

      return decryptedResult
    }
    catch (error) {
      console.error('Error decrypting log data:', error)
      throw error
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
      const oldFile = this.currentLogFile
      const newFile = this.generateLogFilename()

      // Rename the old file to include a timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const rotatedFile = oldFile.replace(/\.log$/, `-${timestamp}.log`)
      await rename(oldFile, rotatedFile)

      // Set the new file as current
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

  private async writeToFile(data: string): Promise<void> {
    if (isBrowserProcess())
      return

    try {
      // Ensure log directory exists
      await mkdir(this.config.logDirectory, { recursive: true })

      // Ensure current log file is set
      this.currentLogFile = this.generateLogFilename()

      // Encrypt data if configured
      const encryptedData = await this.encrypt(data)
      console.error('Encrypted data length:', encryptedData?.length || 0)

      // Check if we need to rotate before writing
      await this.rotateLog()

      // Create an empty file if it doesn't exist
      if (!(await stat(this.currentLogFile).catch(() => null))) {
        await writeFile(this.currentLogFile, '')
      }

      // Append to current log file with newline
      await appendFile(this.currentLogFile, `${encryptedData}\n`)
      console.error('Encrypted data written to file:', this.currentLogFile)

      // Get file stats for debugging
      const stats = await stat(this.currentLogFile)
      console.error('File size after write:', stats.size)
    }
    catch (error) {
      console.error('Error in writeToFile:', error)
      throw error
    }
  }

  private async log(level: LogLevel, message: string, ...args: any[]): Promise<(() => void) | void> {
    console.error('log method called with level:', level, 'message:', message)
    if (!this.shouldLog(level)) {
      console.error('shouldLog returned false')
      return
    }

    const entry: LogEntry = {
      timestamp: this.options.timestamp ? new Date(this.options.timestamp) : new Date(),
      level,
      message,
      args,
      name: this.name,
    }

    console.error('Created log entry:', entry)
    const formattedEntry = await this.formatter.format(entry)
    console.error('formatted entry:', formattedEntry)

    // Handle fingers crossed logging if enabled
    if (this.fingersCrossedConfig) {
      console.error('using fingers crossed logging')
      await this.handleFingersCrossedBuffer(level, formattedEntry)
      return
    }

    // For performance tracking
    if (level === 'info') {
      const timerId = Math.random().toString(36).slice(2)
      this.timers.set(timerId, performance.now())

      // eslint-disable-next-line no-console
      console.log(formattedEntry)
      console.error('calling writeToFile for info level')
      try {
        await this.writeToFile(formattedEntry)
        console.error('writeToFile completed successfully for info level')
      }
      catch (error) {
        console.error('Error in writeToFile for info level:', error)
      }

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
    console.error('calling writeToFile')
    try {
      await this.writeToFile(formattedEntry)
      console.error('writeToFile completed successfully')
    }
    catch (error) {
      console.error('Error in writeToFile:', error)
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args)
  }

  success(message: string, ...args: any[]): void {
    this.log('success', message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.log('warning', message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args)
  }

  extend(namespace: string): Logger {
    const subLoggerName = `${this.name}:${namespace}`

    if (!this.subLoggers.has(subLoggerName)) {
      const subLoggerOptions: LoggerOptions = {
        ...this.options,
        logDirectory: this.config.logDirectory,
        level: this.config.level,
        format: this.config.format,
        rotation: typeof this.config.rotation === 'boolean' ? undefined : this.config.rotation,
      }

      this.subLoggers.set(
        subLoggerName,
        new Logger(subLoggerName, subLoggerOptions),
      )
    }

    return this.subLoggers.get(subLoggerName)!
  }

  only(fn: () => void): void {
    if (process.env.DEBUG?.includes(this.name) || process.env.DEBUG === '*')
      fn()
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

    this.timers.clear()
  }

  time(label: string): () => void {
    const start = Date.now()
    this.timers.set(label, start)

    return () => {
      const end = Date.now()
      const duration = end - this.timers.get(label)!
      this.info(`${label} completed in ${duration}ms`)
      this.timers.delete(label)
    }
  }

  createReadStream(): Readable {
    if (!this.config.logDirectory) {
      throw new Error('Log directory not configured')
    }
    return createReadStream(this.config.logDirectory)
  }

  get isServer(): boolean {
    return typeof window === 'undefined'
  }

  get isBrowser(): boolean {
    return !this.isServer
  }
}
