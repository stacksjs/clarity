import type { ClarityConfig, Formatter, LogEntry, LogLevel } from '../types'
import process from 'node:process'
import * as colors from '../colors'
import { format } from '../format'

// Check if Unicode is supported
function isUnicodeSupported(): boolean {
  try {
    return process.platform !== 'win32'
      || Boolean(process.env.CI)
      || Boolean(process.env.WT_SESSION) // Windows Terminal
      || process.env.TERM_PROGRAM === 'vscode'
      || process.env.TERM === 'xterm-256color'
      || process.env.TERM === 'alacritty'
  }
  catch {
    return false
  }
}

const unicode = isUnicodeSupported()
const s = (c: string, fallback: string) => (unicode ? c : fallback)

// ANSI escape codes for colors not in the colors module
const ANSI = {
  cyan: '\x1B[36m',
  reset: '\x1B[0m',
  underline: '\x1B[4m',
}

export class TextFormatter implements Formatter {
  constructor(private config: ClarityConfig) { }

  async format(entry: LogEntry, forFile: boolean = false): Promise<string> {
    const timestamp = this.config.timestamp ? `${colors.gray(entry.timestamp.toISOString())} ` : ''
    const name = colors.gray(`[${entry.name}]`)

    const levelSymbols: Record<LogLevel, string> = {
      debug: s('🔍', 'D'),
      info: s('ℹ️', 'i'),
      success: s('✅', '√'),
      warning: s('⚠️', '‼'),
      error: s('❌', '×'),
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

    // Format message with character highlighting
    message = this.characterFormat(message)

    // Format stack traces if present
    if (entry.level === 'error' && message.includes('\n')
      && (message.includes('at ') || message.includes('stack:'))) {
      message = this.formatStack(message)
    }

    const symbol = this.config.colors ? levelSymbols[entry.level] : ''
    message = this.config.colors
      ? levelColors[entry.level](message)
      : message

    // For file output, put timestamp at beginning
    if (forFile) {
      return `${entry.timestamp.toISOString()} ${name} ${symbol} ${message}`
    }

    return `${timestamp}${name} ${symbol} ${message}`
  }

  // Format text with character highlighting (backticks and underscores)
  private characterFormat(str: string): string {
    if (!this.config.colors)
      return str

    return str
      // highlight backticks
      .replace(/`([^`]+)`/g, (_, m) => `${ANSI.cyan}${m}${ANSI.reset}`)
      // underline underscores
      .replace(/\s+_([^_]+)_\s+/g, (_, m) => ` ${ANSI.underline}${m}${ANSI.reset} `)
  }

  // Format stack traces
  private formatStack(stack: string): string {
    if (!stack)
      return ''

    const lines = stack.split('\n')
    const formattedLines = lines.map((line, i) => {
      if (i === 0)
        return line // Keep the first line as is

      if (line.trim().startsWith('at ')) {
        // Use a safer pattern to avoid backtracking issues
        const atParts = line.trim().split(/^at\s+/)
        if (atParts.length > 1) {
          const funcLocationParts = atParts[1].split(' (')
          if (funcLocationParts.length > 1) {
            const fnName = funcLocationParts[0]
            const location = funcLocationParts[1].replace(')', '')
            return `  ${colors.gray(`at ${ANSI.cyan}${fnName}${ANSI.reset} (${location})`)}`
          }
        }
        return `  ${colors.gray(line.trim())}`
      }
      return `  ${line}`
    })

    return formattedLines.join('\n')
  }
}
