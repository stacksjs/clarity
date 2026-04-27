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

// `config` is exported synchronously, populated from `defaultConfig` and
// **mutated in place** when the user's `clarity.config.ts` (if any) finishes
// loading via `configReady`.
//
// Why not the obvious `export const config = await loadConfig()`: top-level
// await turns this module — and therefore *every* dependent of
// `@stacksjs/clarity` — into an async-init module. Anything bundled along
// with clarity inherits the TLA, so a single misbehaving config file (or a
// transient `bunfig` hang) can freeze importers like `@stacksjs/bunpress`
// at module-evaluation time. Keeping the export synchronous decouples
// "logger usable" from "user config resolved".
export const config: ClarityConfig = { ...defaultConfig }

/**
 * Resolves once the user's `clarity.config.{ts,js,json}` (if present) has
 * been merged onto `config`. Callers that need the resolved values can
 * `await configReady`; everyone else (the common case) just uses `config`
 * with default values until the project's overrides land.
 */
export const configReady: Promise<ClarityConfig> = (async () => {
  try {
    const loadedConfig = await bunfigLoadConfig({
      name: 'clarity',
      alias: 'logging',
      defaultConfig,
      cwd: process.cwd(),
    }) as Partial<ClarityConfig> | undefined

    if (loadedConfig)
      Object.assign(config, loadedConfig)
  }
  catch {
    // Leave defaults in place — clarity remains fully functional.
  }
  return config
})()
