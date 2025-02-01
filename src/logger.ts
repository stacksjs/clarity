import type { LogFormatter } from './formatters'
import type { LogColors, LogEntry, LogLevel } from './types'
import process from 'node:process'
import * as colors from './colors'
import { format } from './format'
import { createFormatter } from './formatters'
import { logManager } from './storage/log-manager'
import { isServerProcess } from './utils'

export interface LoggerOptions {
  format?: 'json' | 'text'
  colors?: boolean
  timestamp?: boolean
}

export class Logger {
  private formatter!: LogFormatter
  private isServer!: boolean
  private readonly prefix: string

  constructor(
    private readonly name: string,
    private options: LoggerOptions = {},
  ) {
    this.prefix = `[${this.name}]`
    this.initialize()
  }

  private async initialize() {
    this.formatter = await createFormatter(
      this.options.format || (process.env.NODE_ENV === 'production' ? 'json' : 'text'),
      { colors: this.options.colors ?? true },
    )
    this.isServer = await isServerProcess()
  }

  public extend(domain: string): Logger {
    return new Logger(`${this.name}:${domain}`, this.options)
  }

  public debug(message: any, ...positionals: Array<unknown>): void {
    void this.logEntry({
      level: 'debug',
      message: colors.gray(String(message)),
      positionals,
      colors: { prefix: 'gray' },
    })
  }

  public info(message: any, ...positionals: Array<unknown>): (endMessage?: any, ...endPositionals: Array<unknown>) => void {
    const startTime = performance.now()
    void this.logEntry({
      level: 'info',
      message,
      positionals,
      colors: { prefix: 'blue' },
    })

    return (endMessage?: any, ...endPositionals: Array<unknown>) => {
      const duration = (performance.now() - startTime).toFixed(2)
      if (endMessage) {
        const finalMessage = typeof endMessage === 'string'
          ? `${endMessage} ${colors.gray(`+${duration}ms`)}`
          : endMessage

        void this.logEntry({
          level: 'info',
          message: finalMessage,
          positionals: endPositionals,
          colors: { prefix: 'blue' },
        })
      }
    }
  }

  public success(message: any, ...positionals: Array<unknown>): void {
    void this.logEntry({
      level: 'success',
      message,
      positionals,
      prefix: `✔ ${this.prefix}`,
      colors: { timestamp: 'green', prefix: 'green' },
    })
  }

  public warning(message: any, ...positionals: Array<unknown>): void {
    void this.logEntry({
      level: 'warning',
      message,
      positionals,
      prefix: `⚠ ${this.prefix}`,
      colors: { timestamp: 'yellow', prefix: 'yellow' },
    })
  }

  public error(message: any, ...positionals: Array<unknown>): void {
    void this.logEntry({
      level: 'error',
      message,
      positionals,
      prefix: `✖ ${this.prefix}`,
      colors: { timestamp: 'red', prefix: 'red' },
    })
  }

  public only(callback: () => void): void {
    const isEnabled = process.env.DEBUG === 'true'
      || process.env.DEBUG === '1'
      || process.env.DEBUG === this.name
      || (process.env.DEBUG && this.name.startsWith(process.env.DEBUG))

    if (isEnabled) {
      callback()
    }
  }

  private async logEntry(args: {
    level: LogLevel
    message: any
    positionals?: Array<unknown>
    prefix?: string
    colors?: {
      timestamp?: LogColors
      prefix?: LogColors
    }
  }): Promise<void> {
    const { level, message, positionals = [], prefix, colors: customColors } = args
    const formattedMessage = this.formatMessage(message, positionals)
    const entry = this.createEntry(level, formattedMessage)

    // Store the log entry in background
    logManager.addEntry(entry).catch(() => { /* silent failure */ })

    try {
      const output = await this.formatter.format(entry)
      this.getWriter(level)(output)
    }
    catch (e) {
      console.error('Error formatting log entry:', e)
    }
  }

  private createEntry(level: LogLevel, message: unknown): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      name: this.name,
    }
  }

  private formatMessage(message: any, positionals: any[] = []): string {
    if (typeof message === 'string' && positionals.length > 0) {
      return format(message, ...positionals)
    }

    if (message instanceof Error) {
      return message.stack || message.message
    }

    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2)
    }

    return String(message)
  }

  private getWriter(level: LogLevel): (output: string) => void {
    return (output: string) => {
      if (this.isServer) {
        if (level === 'error' || level === 'warning') {
          process.stderr.write(`${output}\n`)
        }
        else {
          process.stdout.write(`${output}\n`)
        }
      }
      else {
        switch (level) {
          case 'debug':
            // eslint-disable-next-line no-console
            console.debug(output)
            break
          case 'warning':
            console.warn(output)
            break
          case 'error':
            console.error(output)
            break
          default:
            // eslint-disable-next-line no-console
            console.log(output)
        }
      }
    }
  }
}
