import type { ConfigOptions } from './types'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Logger } from '../index'
import { configManager } from '../storage/config-manager'

const CONFIG_FILE = join(homedir(), '.clarity', 'config.json')

export async function handleConfig(options: ConfigOptions): Promise<void> {
  const logger = new Logger('cli:config')

  await configManager.initialize()

  switch (options.action) {
    case 'get': {
      if (!options.key) {
        logger.error('Key is required for get action')
        return
      }
      const value = await configManager.get(options.key)
      logger.info(`${options.key}: ${JSON.stringify(value)}`)
      break
    }

    case 'set': {
      if (!options.key || options.value === undefined) {
        logger.error('Both key and value are required for set action')
        return
      }
      await configManager.set(options.key, options.value)
      logger.success(`Set ${options.key} to ${options.value}`)
      break
    }

    case 'list': {
      const config = await configManager.list()
      logger.info('Current configuration:')
      console.log(JSON.stringify(config, null, 2))
      break
    }

    default:
      logger.error('Invalid config action. Use get, set, or list')
  }
}

export async function loadConfig(): Promise<Record<string, any>> {
  try {
    const content = await readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(content)
  }
  catch {
    return {}
  }
}

export async function saveConfig(config: Record<string, any>): Promise<void> {
  try {
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
  }
  catch (error) {
    console.error('Failed to save config:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
