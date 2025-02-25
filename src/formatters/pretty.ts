import type { ClarityConfig, Formatter, LogEntry } from '../types'
import { format } from '../format'

const COLORS = {
  reset: '\x1B[0m',
  dim: '\x1B[2m',
  black: '\x1B[30m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
  white: '\x1B[37m',
  brightRed: '\x1B[91m',
  brightGreen: '\x1B[92m',
  brightYellow: '\x1B[93m',
  brightBlue: '\x1B[94m',
  brightMagenta: '\x1B[95m',
  brightCyan: '\x1B[96m',
  brightWhite: '\x1B[97m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgMagenta: '\x1B[45m',
  bgCyan: '\x1B[46m',
  bgWhite: '\x1B[47m',
  bold: '\x1B[1m',
  underline: '\x1B[4m',
}

const ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

interface LevelStyle {
  color: string
  label: string
  box?: boolean
}

const LEVEL_STYLES: Record<string, LevelStyle> = {
  debug: { color: COLORS.dim + COLORS.white, label: 'DEBUG' },
  info: { color: COLORS.brightBlue, label: 'INFO' },
  success: { color: COLORS.brightGreen, label: 'SUCCESS' },
  warning: { color: COLORS.brightYellow, label: 'WARN', box: true },
  error: { color: COLORS.brightRed, label: 'ERROR', box: true },
}

// Default terminal width for right-aligning timestamps
const DEFAULT_TERMINAL_WIDTH = 120

// Helper to strip ANSI escape codes for length calculations and file output
function stripAnsi(str: string): string {
  let result = ''
  let inEscSeq = false

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\x1B' && str[i + 1] === '[') {
      inEscSeq = true
      continue
    }

    if (inEscSeq) {
      if (str[i] === 'm') {
        inEscSeq = false
      }
      continue
    }

    result += str[i]
  }

  return result
}

// Helper to create a box around text
function createBox(text: string, color: string, forFile: boolean = false): string {
  const lines = text.split('\n')
  const visibleLines = lines.map(line => stripAnsi(line))

  // Calculate appropriate width
  const maxContentWidth = Math.max(...visibleLines.map(line => line.length))
  const boxWidth = maxContentWidth + 4 // 2 chars padding on each side

  if (forFile) {
    // Simple box for file output without colors
    const horizontalBorder = '='.repeat(boxWidth - 2)
    const topBorder = `+${horizontalBorder}+`
    const bottomBorder = `+${horizontalBorder}+`

    // Format each line with vertical borders
    const formattedLines = lines.map((line) => {
      const visibleLength = stripAnsi(line).length
      const padding = ' '.repeat(maxContentWidth - visibleLength)
      return `| ${stripAnsi(line)}${padding} |`
    })

    // Return the complete box
    return [topBorder, ...formattedLines, bottomBorder].join('\n')
  }
  else {
    // Fancy box for console output with colors
    const horizontalBorder = '═'.repeat(boxWidth - 2)
    const topBorder = `${color}╔${horizontalBorder}╗${COLORS.reset}`
    const bottomBorder = `${color}╚${horizontalBorder}╝${COLORS.reset}`

    // Format each line with vertical borders
    const formattedLines = lines.map((line) => {
      const visibleLength = stripAnsi(line).length
      const padding = ' '.repeat(maxContentWidth - visibleLength)
      return `${color}║${COLORS.reset} ${line}${padding} ${color}║${COLORS.reset}`
    })

    // Return the complete box
    return [topBorder, ...formattedLines, bottomBorder].join('\n')
  }
}

export class PrettyFormatter implements Formatter {
  private config: ClarityConfig
  private terminalWidth: number

  constructor(config: ClarityConfig) {
    this.config = config
    // Use sensible default if terminalWidth not specified in config
    this.terminalWidth = DEFAULT_TERMINAL_WIDTH
  }

  async format(entry: LogEntry, forFile: boolean = false): Promise<string> {
    const { timestamp, level, message, args = [], name } = entry
    const formattedMessage = args.length ? format(message, ...args) : message

    const style = LEVEL_STYLES[level]
    const icon = ICONS[level]

    // Format timestamp first for files
    const timestampStr = timestamp.toISOString()
    const formattedTimestamp = forFile
      ? timestampStr
      : `${COLORS.dim}${timestampStr}${COLORS.reset}`

    // Format logger name - with or without colors
    const formattedName = forFile
      ? `[${name}]`
      : `${COLORS.brightCyan}[${name}]${COLORS.reset}`

    // Format level with icon - with or without colors
    const levelOutput = forFile
      ? `${icon} `
      : `${style.color}${icon} ${COLORS.reset}`

    // Check if this is a stack trace from an error
    let formattedContent = formattedMessage

    // Format error stack traces
    if (level === 'error' && formattedMessage.includes('\n')
      && (formattedMessage.includes('at ') || formattedMessage.includes('stack:'))) {
      // Format the stack trace with proper indentation and coloring
      const lines = formattedMessage.split('\n')
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
              return forFile
                ? `  at ${fnName} (${location})`
                : `  ${COLORS.dim}at ${COLORS.cyan}${fnName}${COLORS.dim} (${location})${COLORS.reset}`
            }
          }
          return forFile
            ? `  ${line.trim()}`
            : `  ${COLORS.dim}${line.trim()}${COLORS.reset}`
        }
        return `  ${line}`
      })

      formattedContent = formattedLines.join('\n')
    }

    // For file output, construct message with timestamp at start
    if (forFile) {
      // For warnings and errors with boxes
      if (style.box) {
        const levelLabel = style.label
        const boxedContent = createBox(formattedContent, level === 'error' ? COLORS.red : COLORS.yellow, forFile)
        const boxLines = boxedContent.split('\n')

        // Add timestamp to first line and proper indentation to box lines
        return [
          `${timestampStr} ${formattedName} ${levelLabel}`,
          ...boxLines.map(line => `${timestampStr} ${' '.repeat(formattedName.length + levelLabel.length + 2)} ${line}`),
        ].join('\n')
      }

      // For regular messages
      return `${timestampStr} ${formattedName} ${levelOutput}${formattedContent}`
    }

    // For console output, construct the message with right-aligned timestamp
    let logContent = ''

    if (style.box) {
      const levelLabel = `${style.color}${style.label}${COLORS.reset}`
      if (level === 'error') {
        logContent = `${formattedName} ${levelLabel}\n${createBox(formattedContent, COLORS.red, forFile)}`
      }
      else if (level === 'warning') {
        logContent = `${formattedName} ${levelLabel}\n${createBox(formattedContent, COLORS.yellow, forFile)}`
      }
    }
    else {
      logContent = `${formattedName} ${levelOutput}${formattedContent}`
    }

    // For console output, right-align timestamp
    if (logContent.includes('\n')) {
      const lines = logContent.split('\n')

      // Calculate right padding for timestamp on first line
      const firstLineVisibleLength = stripAnsi(lines[0]).length
      const timestampVisibleLength = stripAnsi(formattedTimestamp).length

      // Calculate padding to push timestamp to the right
      const padding = Math.max(0, this.terminalWidth - firstLineVisibleLength - timestampVisibleLength - 1)

      // Add right-aligned timestamp to first line
      lines[0] = `${lines[0]}${' '.repeat(padding)}${formattedTimestamp}`

      return lines.join('\n')
    }
    else {
      // Calculate right padding for timestamp
      const logContentVisibleLength = stripAnsi(logContent).length
      const timestampVisibleLength = stripAnsi(formattedTimestamp).length

      // Calculate padding to push timestamp to the right
      const padding = Math.max(0, this.terminalWidth - logContentVisibleLength - timestampVisibleLength - 1)

      // Add right-aligned timestamp
      return `${logContent}${' '.repeat(padding)}${formattedTimestamp}`
    }
  }

  // New method to format for file output (without ANSI colors)
  async formatForFile(entry: LogEntry): Promise<string> {
    return this.format(entry, true)
  }
}
