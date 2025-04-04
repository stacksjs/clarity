/**
 * ANSI Color codes for terminal output
 */

// Basic colors
export const reset = '\x1B[0m'
export const bold = '\x1B[1m'
export const dim = '\x1B[2m'

// Foreground colors
export const black = '\x1B[30m'
export const red = '\x1B[31m'
export const green = '\x1B[32m'
export const yellow = '\x1B[33m'
export const blue = '\x1B[34m'
export const magenta = '\x1B[35m'
export const cyan = '\x1B[36m'
export const white = '\x1B[37m'
export const gray = '\x1B[90m'

// Background colors
export const bgBlack = '\x1B[40m'
export const bgRed = '\x1B[41m'
export const bgGreen = '\x1B[42m'
export const bgYellow = '\x1B[43m'
export const bgBlue = '\x1B[44m'
export const bgMagenta = '\x1B[45m'
export const bgCyan = '\x1B[46m'
export const bgWhite = '\x1B[47m'

// Log level specific colors
export const levels = {
  debug: gray,
  info: blue,
  success: green,
  warning: yellow,
  error: red,
}

/**
 * Wrap text with color codes
 */
export function colorize(text: string, color: string): string {
  return `${color}${text}${reset}`
}

/**
 * Remove ANSI color codes from text
 */
export function stripColors(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[\d+m/g, '')
}
