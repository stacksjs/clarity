import type { LogEntry } from '../types'
// src/formatters/text.ts
import type { LogFormatter } from './types'
import * as colors from '../colors'

export class TextFormatter implements LogFormatter {
  constructor(private useColors: boolean = true) { }

  async format(entry: LogEntry): Promise<string> {
    const timestamp = this.formatTimestamp(entry.timestamp)
    const level = this.formatLevel(entry.level)
    const prefix = this.formatPrefix(entry.name)
    const message = this.formatMessage(entry.message)

    return `${timestamp} ${prefix} ${level}: ${message}`
  }

  private formatTimestamp(timestamp: Date): string {
    const time = `${timestamp.toLocaleTimeString()}:${timestamp.getMilliseconds()}`
    return this.useColors ? colors.gray(time) : time
  }

  private formatLevel(level: string): string {
    if (!this.useColors)
      return level.toUpperCase()

    switch (level) {
      case 'debug': return colors.gray('DEBUG')
      case 'info': return colors.blue('INFO')
      case 'success': return colors.green('SUCCESS')
      case 'warning': return colors.yellow('WARNING')
      case 'error': return colors.red('ERROR')
      default: return level.toUpperCase()
    }
  }

  private formatPrefix(name: string): string {
    const prefix = `[${name}]`
    return this.useColors ? colors.blue(prefix) : prefix
  }

  private formatMessage(message: any): string {
    if (typeof message === 'string')
      return message
    return JSON.stringify(message, null, 2)
  }
}
