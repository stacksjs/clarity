import type { ClarityConfig, Formatter, LogEntry, LogLevel } from '../types'
import * as colors from '../colors'
import { format } from '../format'

export class TextFormatter implements Formatter {
  constructor(private config: ClarityConfig) { }

  async format(entry: LogEntry): Promise<string> {
    const timestamp = this.config.timestamp ? `${colors.gray(entry.timestamp.toISOString())} ` : ''
    const name = colors.gray(`[${entry.name}]`)

    const levelSymbols: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }

    const levelColors: Record<LogLevel, (text: string) => string> = {
      debug: colors.gray,
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
    }

    // Handle positional formatting if args are present
    let message = entry.message
    if (Array.isArray(entry.args))
      message = format(entry.message, ...entry.args)

    const symbol = this.config.colors ? levelSymbols[entry.level] : ''
    message = this.config.colors
      ? levelColors[entry.level](message)
      : message

    return `${timestamp}${name} ${symbol} ${message}`
  }
}
