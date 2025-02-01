import type { LogEntry } from '../types'

export interface LogFormatter {
  format: (entry: LogEntry) => Promise<string> | string
}
