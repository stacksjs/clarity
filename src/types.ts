import type * as colors from './colors'

export interface ClarityConfig {
  verbose: boolean
}

export type ClarityOptions = Partial<ClarityConfig>

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'

export type LogColors = keyof typeof colors

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: any
  name: string
}

export type ColorFunction = (text: string) => void
