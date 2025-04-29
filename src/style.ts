export type TerminalStyle = (text: string) => string

export interface TerminalStyles {
  red: TerminalStyle
  green: TerminalStyle
  yellow: TerminalStyle
  blue: TerminalStyle
  magenta: TerminalStyle
  cyan: TerminalStyle
  white: TerminalStyle
  gray: TerminalStyle
  bgRed: TerminalStyle
  bgYellow: TerminalStyle
  bold: TerminalStyle
  dim: TerminalStyle
  italic: TerminalStyle
  underline: TerminalStyle
  reset: string
}

const terminalStyles: TerminalStyles = {
  red: (text: string) => `\x1B[31m${text}\x1B[0m`,
  green: (text: string) => `\x1B[32m${text}\x1B[0m`,
  yellow: (text: string) => `\x1B[33m${text}\x1B[0m`,
  blue: (text: string) => `\x1B[34m${text}\x1B[0m`,
  magenta: (text: string) => `\x1B[35m${text}\x1B[0m`,
  cyan: (text: string) => `\x1B[36m${text}\x1B[0m`,
  white: (text: string) => `\x1B[37m${text}\x1B[0m`,
  gray: (text: string) => `\x1B[90m${text}\x1B[0m`,
  bgRed: (text: string) => `\x1B[41m${text}\x1B[0m`,
  bgYellow: (text: string) => `\x1B[43m${text}\x1B[0m`,
  bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
  dim: (text: string) => `\x1B[2m${text}\x1B[0m`,
  italic: (text: string) => `\x1B[3m${text}\x1B[0m`,
  underline: (text: string) => `\x1B[4m${text}\x1B[0m`,
  reset: '\x1B[0m',
}

export const styles: TerminalStyles = terminalStyles
export const red: TerminalStyle = terminalStyles.red
export const green: TerminalStyle = terminalStyles.green
export const yellow: TerminalStyle = terminalStyles.yellow
export const blue: TerminalStyle = terminalStyles.blue
export const magenta: TerminalStyle = terminalStyles.magenta
export const cyan: TerminalStyle = terminalStyles.cyan
export const white: TerminalStyle = terminalStyles.white
export const gray: TerminalStyle = terminalStyles.gray
export const bgRed: TerminalStyle = terminalStyles.bgRed
export const bgYellow: TerminalStyle = terminalStyles.bgYellow
export const bold: TerminalStyle = terminalStyles.bold
export const dim: TerminalStyle = terminalStyles.dim
export const italic: TerminalStyle = terminalStyles.italic
export const underline: TerminalStyle = terminalStyles.underline
export const reset: string = terminalStyles.reset
