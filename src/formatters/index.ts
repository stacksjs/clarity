import type { LogFormatter } from './types'
import { JsonFormatter } from './json'
import { TextFormatter } from './text'

export * from './json'
export * from './text'
export * from './types'

export async function createFormatter(format: 'json' | 'text' = 'text', options: { colors?: boolean } = {}): Promise<LogFormatter> {
  switch (format) {
    case 'json':
      return new JsonFormatter()
    case 'text':
      return new TextFormatter(options.colors)
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
