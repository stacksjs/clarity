import type { LogFormatter } from './formatters'
import type { LogLevel } from './types'
import process from 'node:process'
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
  private formatter: LogFormatter
  private isServer: boolean

  constructor(
    private readonly name: string,
    private options: LoggerOptions = {},
  ) {
    this.formatter = createFormatter(
      options.format || (process.env.NODE_ENV === 'production' ? 'json' : 'text'),
      { colors: options.colors ?? true },
    )
    this.isServer = await isServerProcess()
  }

  public extend(domain: string): Logger {
    return new Logger(`${this.name}:${domain}`, this.options)
  }

  public async debug(message: any, ...args: Array<unknown>): Promise<void> {
    await this.log('debug', message, ...args)
  }

  public info(message: any, ...args: Array<unknown>): () => Promise<void> {
    const startTime = performance.now()
    void this.log('info', message, ...args)

    return async (endMessage?: string, ...endArgs: Array<unknown>) => {
      const duration = (performance.now() - startTime).toFixed(2)
      if (endMessage) {
        await this.log('info', `${endMessage} (${duration}ms)`, ...endArgs)
      }
    }
  }

  public async success(message: any, ...args: Array<unknown>): Promise<void> {
    await this.log('success', message, ...args)
  }

  public async warning(message: any, ...args: Array<unknown>): Promise<void> {
    await this.log('warning', message, ...args)
  }

  public async error(message: any, ...args: Array<unknown>): Promise<void> {
    await this.log('error', message, ...args)
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

  private async log(level: LogLevel, message: any, ...args: any[]): Promise<void> {
    const entry = {
      timestamp: new Date(),
      level,
      name: this.name,
      message: this.formatMessage(message, args),
    }

    // Store the log entry
    await logManager.addEntry(entry)

    // Format and output the log
    const output = await this.formatter.format(entry)

    if (this.isServer) {
      if (level === 'error' || level === 'warning') {
        process.stderr.write(`${output}\n`)
      }
      else {
        process.stdout.write(`${output}\n`)
      }
    }
    else {
      // Browser environment
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

  private formatMessage(message: any, args: any[] = []): string {
    if (typeof message === 'string' && args.length > 0) {
      return format(message, ...args)
    }
    if (message instanceof Error) {
      return message.stack || message.message
    }
    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2)
    }
    return String(message)
  }
}
