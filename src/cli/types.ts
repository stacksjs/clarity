export interface WatchOptions {
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  verbose?: boolean
  json?: boolean
  timestamp?: boolean
}

export interface LogOptions {
  level?: 'debug' | 'info' | 'success' | 'warning' | 'error'
  name?: string
  verbose?: boolean
}

export interface ExportOptions {
  format?: 'json' | 'text'
  output?: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  start?: string
  end?: string
}

export interface TailOptions {
  lines?: number
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  follow?: boolean
}

export interface SearchOptions {
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  start?: string
  end?: string
  caseSensitive?: boolean
  pattern: string
}

export interface ClearOptions {
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  before?: string
}

export interface ConfigOptions {
  action: 'get' | 'set' | 'list'
  key?: string
  value?: string
}
