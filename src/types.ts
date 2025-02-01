import type * as colors from './colors'

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'
export type LogColors = keyof typeof colors

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: any
  name: string
}

export type ColorFunction = (text: string) => void

export interface ClarityConfig {
  /**
   * Default log level
   * @default 'info'
   */
  level: LogLevel

  /**
   * Default logger name
   * @default 'app'
   */
  defaultName: string

  /**
   * Use JSON output format
   * @default false
   */
  json: boolean

  /**
   * Show timestamps in logs
   * @default true
   */
  timestamp: boolean

  /**
   * Enable colored output
   * @default true
   */
  colors: boolean

  /**
   * Default output format
   * @default 'text'
   */
  format: 'text' | 'json'

  /**
   * Maximum size of log files in bytes before rotation
   * @default 10485760 (10MB)
   */
  maxLogSize: number

  /**
   * Number of rotated files to keep
   * @default 5
   */
  maxLogFiles: number

  /**
   * Enable gzip compression for rotated files
   * @default true
   */
  compressLogs: boolean

  /**
   * Date pattern for rotated files
   * @default 'YYYY-MM-DD'
   */
  logDatePattern: string

  /**
   * Directory to store log files
   * If not specified, defaults to ~/.clarity/logs
   */
  logDirectory: string

  /**
   * Enable verbose output
   * @default false
   */
  verbose: boolean
}

export type ClarityOptions = Partial<ClarityConfig>
