export interface CliOptions {
  level?: string
  name?: string
  json?: boolean
  timestamp?: boolean
  color?: boolean
  verbose?: boolean
  format?: 'json' | 'text'
  output?: string
  start?: string
  end?: string
  compress?: boolean
  lines?: number
  follow?: boolean
  caseSensitive?: boolean
  context?: number
  before?: string
  dryRun?: boolean
  force?: boolean
  key?: string
  value?: string
  action?: 'get' | 'set' | 'list' | 'reset'
}

export interface LogOptions {
  level?: string
  name?: string
  meta?: string
}

export interface ConfigHandlers {
  load: () => Promise<Record<string, any>>
  save: (config: Record<string, any>) => Promise<void>
}

export type ConfigAction = 'get' | 'set' | 'list' | 'reset'

export interface Logger {
  debug: (message: string, ...args: any[]) => Promise<void>
  info: (message: string, ...args: any[]) => Promise<void>
  success: (message: string, ...args: any[]) => Promise<void>
  warn: (message: string, ...args: any[]) => Promise<void>
  error: (message: string | Error, ...args: any[]) => Promise<void>
  getLogDirectory: () => string
  createReadStream: () => NodeJS.ReadableStream
  clear: (filters?: { name?: string, before?: Date }) => Promise<void>
}

export interface WatchOptions {
  level?: string
  name?: string
  format?: 'json' | 'text'
  timestamp?: boolean
  colors?: boolean
}

export interface ExportOptions {
  level?: string
  name?: string
  format?: 'json' | 'text'
  start?: Date
  end?: Date
}

export interface TailOptions {
  level?: string
  name?: string
  colors?: boolean
  lines?: number
}

export interface SearchOptions {
  level?: string
  name?: string
  pattern: string
  caseSensitive?: boolean
  context?: number
  start?: Date
  end?: Date
}

export interface ClearOptions {
  level?: string
  name?: string
  before?: Date
}
