import type { ClarityConfig } from './types'
import { join } from 'node:path'
import process from 'node:process'
import { loadConfig as bunfigLoadConfig } from 'bunfig'

// Get project root directory (where the package.json is located)
function getProjectRoot(): string {
  return process.cwd()
}

// Default log directory is in project root
const defaultLogDirectory = process.env.CLARITY_LOG_DIR || join(getProjectRoot(), 'logs')

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

// Load config with error handling
async function loadConfig(): Promise<ClarityConfig> {
  try {
    // const isVerbose = process.env.CLARITY_VERBOSE === 'true' || defaultConfig.verbose

    const loadedConfig = await bunfigLoadConfig({
      name: 'clarity',
      defaultConfig,
      cwd: process.cwd(),
      endpoint: '',
      headers: {},
    })

    return { ...defaultConfig, ...loadedConfig }
  }
  catch {
    // If anything fails, return default config
    return defaultConfig
  }
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig()
