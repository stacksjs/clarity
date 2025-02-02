import type * as colors from './colors'

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'
export type LogColors = keyof typeof colors

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: any
  name: string
}

export type LogRotationFrequency = 'daily' | 'weekly' | 'monthly' | 'none'

export interface LogRotationConfig {
  /** Maximum file size in bytes before rotation */
  maxSize?: number
  /** Maximum number of rotated files to keep */
  maxFiles?: number
  /** Whether to compress rotated files */
  compress?: boolean
  /** Time-based rotation frequency */
  frequency?: LogRotationFrequency
  /** Hour of the day to perform rotation (0-23) */
  rotateHour?: number
  /** Minute of the hour to perform rotation (0-59) */
  rotateMinute?: number
  /** Day of week for weekly rotation (0-6, 0 is Sunday) */
  rotateDayOfWeek?: number
  /** Day of month for monthly rotation (1-31) */
  rotateDayOfMonth?: number
}

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

  rotation: LogRotationConfig

  /**
   * Enable verbose output
   * @default false
   */
  verbose: boolean
}

export type ClarityOptions = Partial<ClarityConfig>
