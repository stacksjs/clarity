import type { ClarityConfig } from './types'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { loadConfig as bunfigLoadConfig } from 'bunfig'

// Get project root directory (where the package.json is located)
function getProjectRoot(filePath?: string, options: { relative?: boolean } = {}): string {
  let path = process.cwd()

  while (path.includes('storage')) path = resolve(path, '..')

  const finalPath = resolve(path, filePath || '')

  // If the `relative` option is true, return the path relative to the current working directory
  if (options?.relative)
    return relative(process.cwd(), finalPath)

  return finalPath
}

// Default log directory is in project root
const defaultLogDirectory = process.env.CLARITY_LOG_DIR || join(getProjectRoot(), 'logs')

export const defaultConfig: ClarityConfig = {
  level: 'info',
  defaultName: 'clarity',
  timestamp: true,
  colors: true,
  format: 'text',
  maxLogSize: 10 * 1024 * 1024,
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: defaultLogDirectory, // logs folder in project root
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
  writeToFile: false,
}

// Load config with error handling
async function loadConfig(): Promise<ClarityConfig> {
  try {
    // const isVerbose = process.env.CLARITY_VERBOSE === 'true' || defaultConfig.verbose

    // bunfig.tryLoadConfig expects (name, options)
    const loadedConfig = await bunfigLoadConfig('clarity', {
      defaultConfig,
      cwd: process.cwd(),
    }) as Partial<ClarityConfig> | undefined

    return { ...defaultConfig, ...(loadedConfig || {}) }
  }
  catch {
    // If anything fails, return default config
    return defaultConfig
  }
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig()
