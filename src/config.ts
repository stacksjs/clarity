import type { ClarityConfig } from './types'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { loadConfig } from 'bunfig'

// Default log directory is in user's home directory
const defaultLogDirectory = process.env.CLARITY_LOG_DIR || join(homedir(), '.clarity', 'logs')

export const defaultConfig: ClarityConfig = {
  level: 'info',
  defaultName: 'app',
  timestamp: true,
  colors: true,
  format: 'text',
  maxLogSize: 10 * 1024 * 1024,
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: defaultLogDirectory,
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    compress: false,
    rotateHour: 0,
    rotateMinute: 0,
    rotateDayOfWeek: 0,
    rotateDayOfMonth: 1,
    encrypt: false,
  },
  verbose: false,
}

// @ts-expect-error there is a current dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig()
