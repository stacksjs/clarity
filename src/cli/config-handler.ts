import type { ConfigOptions } from './types'
import { Logger } from '../index'
import { configManager } from '../storage/config-manager'

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
