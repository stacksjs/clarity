import type { ExportOptions, LogOptions, SearchOptions, TailOptions, WatchOptions } from './types'
import { writeFile } from 'node:fs/promises'
import { Logger } from '../index'
import { logManager } from '../storage/log-manager'

export async function handleWatch(options: WatchOptions): Promise<void> {
  const logger = new Logger('cli:watch')
  logger.info('Starting watch mode...')

  let lastTimestamp = new Date()

  setInterval(async () => {
    const logs = await logManager.getLogs({
      level: options.level,
      name: options.name,
      start: lastTimestamp,
    })

    logs.forEach((log) => {
      const output = options.json
        ? JSON.stringify(log)
        : formatLogEntry(log, options.timestamp)
      console.log(output)
    })

    if (logs.length > 0) {
      lastTimestamp = new Date(logs[logs.length - 1].timestamp)
    }
  }, 1000)
}

export async function handleLog(message: string, options: LogOptions): Promise<void> {
  const logger = new Logger(options.name || 'cli')
  switch (options.level) {
    case 'debug':
      logger.debug(message)
      break
    case 'info':
      logger.info(message)
      break
    case 'success':
      logger.success(message)
      break
    case 'warning':
      logger.warning(message)
      break
    case 'error':
      logger.error(message)
      break
    default:
      logger.info(message)
  }
}

export async function handleExport(options: ExportOptions): Promise<void> {
  const logger = new Logger('cli:export')
  logger.info('Exporting logs...')

  const logs = await logManager.getLogs({
    level: options.level,
    name: options.name,
    start: options.start ? new Date(options.start) : undefined,
    end: options.end ? new Date(options.end) : undefined,
  })

  const output = options.format === 'json'
    ? JSON.stringify(logs, null, 2)
    : logs.map(log => formatLogEntry(log, true)).join('\n')

  if (options.output) {
    await writeFile(options.output, output)
    logger.success(`Exported ${logs.length} logs to ${options.output}`)
  }
  else {
    console.log(output)
  }
}

export async function handleTail(options: TailOptions): Promise<void> {
  const logger = new Logger('cli:tail')

  async function showLogs() {
    const logs = await logManager.getLogs({
      level: options.level,
      name: options.name,
      limit: options.lines,
    })

    logs.forEach((log) => {
      console.log(formatLogEntry(log, true))
    })
  }

  await showLogs()

  if (options.follow) {
    logger.info('Following log output...')
    let lastTimestamp = new Date()

    setInterval(async () => {
      const newLogs = await logManager.getLogs({
        level: options.level,
        name: options.name,
        start: lastTimestamp,
      })

      newLogs.forEach((log) => {
        console.log(formatLogEntry(log, true))
      })

      if (newLogs.length > 0) {
        lastTimestamp = new Date(newLogs[newLogs.length - 1].timestamp)
      }
    }, 1000)
  }
}

export async function handleSearch(pattern: string, options: SearchOptions): Promise<void> {
  const logger = new Logger('cli:search')
  logger.info(`Searching for pattern: ${pattern}`)

  const logs = await logManager.search(pattern, {
    level: options.level,
    name: options.name,
    start: options.start ? new Date(options.start) : undefined,
    end: options.end ? new Date(options.end) : undefined,
    caseSensitive: options.caseSensitive,
  })

  logs.forEach((log) => {
    console.log(formatLogEntry(log, true))
  })

  logger.info(`Found ${logs.length} matching entries`)
}

export async function handleClear(options: {
  level?: string
  name?: string
  before?: string
}): Promise<void> {
  const logger = new Logger('cli:clear')

  await logManager.clear({
    level: options.level as any,
    name: options.name,
    before: options.before ? new Date(options.before) : undefined,
  })

  logger.success('Logs cleared successfully')
}

function formatLogEntry(log: any, showTimestamp: boolean = false): string {
  const timestamp = showTimestamp ? new Date(log.timestamp).toISOString() : ''
  return `${timestamp} [${log.name}] ${log.level.toUpperCase()}: ${log.message}`
}
