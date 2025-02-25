import type { ClarityConfig } from './types'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { loadConfig as bunfigLoadConfig } from 'bunfig'

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

// Wrapper around bunfig's loadConfig that handles verbose mode
async function loadConfig() {
  const isVerbose = process.env.CLARITY_VERBOSE === 'true' || defaultConfig.verbose

  // Temporarily override console.error if not in verbose mode
  const originalError = console.error
  if (!isVerbose) {
    console.error = () => {}
  }

  try {
    return await bunfigLoadConfig({
      name: 'clarity',
      defaultConfig,
      cwd: process.cwd(),
      endpoint: '',
      headers: {},
    })
  }
  finally {
    // Always restore console.error
    console.error = originalError
  }
}

// @ts-expect-error there is a current dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig()
