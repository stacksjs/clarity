import type { LogEntry, LogLevel } from '../types'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export class LogManager {
  private logDir: string
  private logFile: string
  private cache: LogEntry[] = []

  constructor() {
    this.logDir = join(homedir(), '.clarity', 'logs')
    this.logFile = join(this.logDir, 'clarity.log')
  }

  async initialize(): Promise<void> {
    await mkdir(this.logDir, { recursive: true })
    try {
      const data = await readFile(this.logFile, 'utf-8')
      this.cache = JSON.parse(data)
    }
    catch {
      this.cache = []
    }
  }

  async save(): Promise<void> {
    await writeFile(this.logFile, JSON.stringify(this.cache), 'utf-8')
  }

  async addEntry(entry: LogEntry): Promise<void> {
    this.cache.push(entry)
    await this.save()
  }

  async getLogs(options: {
    level?: LogLevel
    name?: string
    start?: Date
    end?: Date
    limit?: number
  }): Promise<LogEntry[]> {
    let logs = this.cache

    if (options.level) {
      logs = logs.filter(log => log.level === options.level)
    }

    if (options.name) {
      const pattern = new RegExp(options.name.replace('*', '.*'))
      logs = logs.filter(log => pattern.test(log.name))
    }

    if (options.start) {
      logs = logs.filter(log => new Date(log.timestamp) >= options.start!)
    }

    if (options.end) {
      logs = logs.filter(log => new Date(log.timestamp) <= options.end!)
    }

    if (options.limit) {
      logs = logs.slice(-options.limit)
    }

    return logs
  }

  async clear(options: {
    level?: LogLevel
    name?: string
    before?: Date
  }): Promise<void> {
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
    await this.save()
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
