import type { ClarityConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: ClarityConfig = {
  level: 'info',
  defaultName: 'app',
  json: false,
  timestamp: true,
  colors: true,
  format: 'text',
  maxLogSize: 10 * 1024 * 1024,
  maxLogFiles: 5,
  compressLogs: true,
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: '',
  verbose: false,
}

// @ts-expect-error there is a current dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig({
  name: 'clarity',
  defaultConfig,
})
