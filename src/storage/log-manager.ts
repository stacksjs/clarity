import type { LogEntry, LogLevel } from '../types'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { configManager } from './config-manager'
import { LogRotator } from './log-rotation'

export class LogManager {
  private logDir: string
  private logFile: string
  private rotator: LogRotator
  private cache: LogEntry[] = []

  constructor() {
    this.logDir = join(homedir(), '.clarity', 'logs')
    this.logFile = join(this.logDir, 'clarity.log')
    this.rotator = new LogRotator(this.logDir, this.logFile)
  }

  async initialize(): Promise<void> {
    // Initialize rotator with config from configManager
    const config = await configManager.list()
    this.rotator = new LogRotator(this.logDir, this.logFile, {
      maxSize: config.maxLogSize || 10 * 1024 * 1024, // Default 10MB
      maxFiles: config.maxLogFiles || 5,
      compress: config.compressLogs !== false,
      datePattern: config.logDatePattern || 'YYYY-MM-DD',
    })
    await this.rotator.initialize()

    // Load recent logs into cache
    try {
      const logs = await this.rotator.readLogs({ files: 1 }) // Only load most recent file for cache
      this.cache = logs
    }
    catch {
      this.cache = []
    }
  }

  async addEntry(entry: LogEntry): Promise<void> {
    this.cache.push(entry)
    // Keep cache size reasonable
    if (this.cache.length > 1000) {
      this.cache = this.cache.slice(-1000)
    }
    await this.rotator.writeLog(entry)
  }

  async getLogs(options: {
    level?: LogLevel
    name?: string
    start?: Date
    end?: Date
    limit?: number
  }): Promise<LogEntry[]> {
    // If requesting recent logs, use cache
    if (!options.start && !options.end && (options.limit || 0) <= 1000) {
      return this.filterLogs(this.cache, options)
    }

    // Otherwise, read from files
    const logs = await this.rotator.readLogs({
      start: options.start,
      end: options.end,
    })

    return this.filterLogs(logs, options)
  }

  private filterLogs(logs: LogEntry[], options: {
    level?: LogLevel
    name?: string
    limit?: number
  }): LogEntry[] {
    let filtered = logs

    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level)
    }

    if (options.name) {
      const pattern = new RegExp(options.name.replace('*', '.*'))
      filtered = filtered.filter(log => pattern.test(log.name))
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit)
    }

    return filtered
  }

  async clear(options: {
    level?: LogLevel
    name?: string
    before?: Date
  }): Promise<void> {
    // Clear cache
    let logs = this.cache
    if (options.level) {
      logs = logs.filter(log => log.level !== options.level)
    }
    if (options.name) {
      const pattern = new RegExp(options.name.replace('*', '.*'))
      logs = logs.filter(log => !pattern.test(log.name))
    }
    if (options.before) {
      logs = logs.filter(log => new Date(log.timestamp) > options.before!)
    }
    this.cache = logs

    // Create new log file with filtered logs
    await this.rotator.initialize()
    for (const log of logs) {
      await this.rotator.writeLog(log)
    }
  }

  async search(pattern: string, options: {
    level?: LogLevel
    name?: string
    start?: Date
    end?: Date
    caseSensitive?: boolean
  }): Promise<LogEntry[]> {
    const searchRegex = new RegExp(pattern, options.caseSensitive ? '' : 'i')
    const logs = await this.getLogs(options)

    return logs.filter(log =>
      searchRegex.test(log.message)
      || searchRegex.test(log.name),
    )
  }
}

export const logManager: LogManager = new LogManager()
