import type { LogLevel } from '../types'

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
  watch: (options: WatchOptions) => Promise<NodeJS.ReadableStream>
  export: (options: ExportOptions) => Promise<NodeJS.ReadableStream>
  tail: (options: TailOptions) => Promise<NodeJS.ReadableStream>
  search: (options: SearchOptions) => Promise<NodeJS.ReadableStream>
  clear: (options: ClearOptions) => Promise<void>
  log: (level: string, message: string, metadata?: any, name?: string) => Promise<void>
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
