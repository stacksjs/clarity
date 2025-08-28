export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'

export type RotationFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'none'

export type EncryptionAlgorithm = 'aes-256-cbc' | 'aes-256-gcm' | 'chacha20-poly1305'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  args?: any[]
  name: string
}

export interface KeyRotationConfig {
  enabled: boolean
  interval: number // in days
  maxKeys: number
}

export interface EncryptionConfig {
  algorithm?: EncryptionAlgorithm
  keyId?: string
  compress?: boolean
  keyRotation?: KeyRotationConfig // Added key rotation configuration
}

export interface RotationConfig {
  /** Maximum file size in bytes before rotation */
  maxSize?: number
  /** Maximum number of rotated files to keep */
  maxFiles?: number
  /** Maximum log age in days before deletion */
  maxAge?: number
  /** Whether to compress rotated files */
  compress?: boolean
  /** Time-based rotation frequency */
  frequency?: 'daily' | 'weekly' | 'monthly'
  /** Hour of the day to perform rotation (0-23) */
  rotateHour?: number
  /** Minute of the hour to perform rotation (0-59) */
  rotateMinute?: number
  /** Day of week for weekly rotation (0-6, 0 is Sunday) */
  rotateDayOfWeek?: number
  /** Day of month for monthly rotation (1-31) */
  rotateDayOfMonth?: number
  /** Custom log file name pattern */
  pattern?: string
  /** Enable encryption of rotated files */
  encrypt?: EncryptionConfig | boolean
  /** Key rotation configuration */
  keyRotation?: {
    enabled?: boolean
    interval?: number
    maxKeys?: number
  }
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
   * @default 10485760 // (10MB)
   */
  maxLogSize: number

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
   * Enable log rotation
   */
  rotation: boolean | RotationConfig

  /**
   * Enable verbose output
   * @default false
   */
  verbose: boolean

  /**
   * Write logs to file system in addition to console output
   * @default false
   */
  writeToFile?: boolean
}

export type ClarityOptions = Partial<ClarityConfig>

export interface Formatter {
  format: (entry: LogEntry, forFile?: boolean) => Promise<string>
  formatForFile?: (entry: LogEntry) => Promise<string>
}

export interface LoggerOptions {
  logDirectory?: string
  level?: LogLevel
  format?: 'json' | 'text'
  rotation?: RotationConfig
  timestamp?: string | number | Date
  /**
   * When true, logs are written to files; when false, logs are console-only
   */
  writeToFile?: boolean
  fingersCrossed?: boolean | {
    activationLevel?: LogLevel
    bufferSize?: number
    flushOnDeactivation?: boolean
    stopBuffering?: boolean
  }
}

export interface Logger {
  debug: (message: string, ...args: any[]) => Promise<void>
  info: (message: string, ...args: any[]) => Promise<void>
  success: (message: string, ...args: any[]) => Promise<void>
  warn: (message: string, ...args: any[]) => Promise<void>
  error: (message: string, ...args: any[]) => Promise<void>
  destroy: () => Promise<void>
  createReadStream: () => NodeJS.ReadableStream
  decrypt?: (data: string) => Promise<string>
}
