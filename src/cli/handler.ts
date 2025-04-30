import type { Logger } from '../logger'
import type { LogLevel } from '../types'
import type { CliOptions, ConfigAction, ConfigHandlers, LogOptions } from './cli-types'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'
import { stringify } from 'yaml'

function validateLogLevel(level: string | undefined): LogLevel | undefined {
  if (!level)
    return undefined
  const validLevels: LogLevel[] = ['debug', 'info', 'success', 'warning', 'error']
  return validLevels.includes(level as LogLevel) ? level as LogLevel : undefined
}

export async function handleWatch(logger: Logger, options: CliOptions): Promise<void> {
  const { level: _level, name: _name, json: _json, timestamp: _timestamp, color: _color, verbose } = options

  try {
    const stream = logger.createReadStream()

    for await (const chunk of stream) {
      if (verbose)
        console.error('[Watch]', chunk.toString())
      else
        console.error(chunk.toString())
    }
  }
  catch (error) {
    console.error('Watch error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function handleLog(logger: Logger, message: string, options: LogOptions): Promise<void> {
  console.error('Debug: Starting handleLog')

  // Validate log level
  const validLevel = validateLogLevel(options.level)
  if (!validLevel) {
    console.error('Invalid log level:', options.level)
    process.exit(1)
  }

  // Ensure log directory exists with proper permissions
  const logDir = logger.getLogDirectory()
  console.error('Debug: Creating log directory:', logDir)
  try {
    await mkdir(logDir, { recursive: true, mode: 0o755 })
    console.error('Debug: Log directory created/verified')
  }
  catch (err) {
    console.error('Error creating log directory:', err)
    throw err
  }

  const metadata = options.meta ? JSON.parse(options.meta) : {}

  console.error('Debug: Logging message:', { message, level: validLevel, metadata })

  try {
    // Call appropriate log method based on level
    switch (validLevel) {
      case 'debug':
        await logger.debug(message, metadata)
        break
      case 'info':
        await logger.info(message, metadata)
        break
      case 'success':
        await logger.success(message, metadata)
        break
      case 'warning':
        await logger.warn(message, metadata)
        break
      case 'error':
        await logger.error(message, metadata)
        break
    }

    console.error('Debug: Log operation completed successfully')
  }
  catch (err) {
    console.error('Debug: Error during logging:', err)
    throw err
  }
}

export async function handleExport(logger: Logger, options: CliOptions): Promise<void> {
  const { format: _format, output, level: _level, name: _name, start: _start, end: _end, compress } = options

  try {
    const stream = logger.createReadStream()

    const writeStream = output
      ? createWriteStream(output)
      : process.stdout

    if (compress)
      await pipeline(stream, createGzip(), writeStream)
    else
      await pipeline(stream, writeStream)
  }
  catch (error) {
    console.error('Export error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function handleTail(logger: Logger, options: CliOptions): Promise<void> {
  const { lines: _lines, follow, level: _level, name: _name, color: _color } = options

  try {
    const stream = logger.createReadStream()

    for await (const chunk of stream) {
      console.error(chunk.toString())
      if (!follow)
        break
    }
  }
  catch (error) {
    console.error('Tail error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function handleSearch(logger: Logger, pattern: string, options: CliOptions): Promise<void> {
  const { level: _level, name: _name, start: _start, end: _end, caseSensitive: _caseSensitive, context: _context } = options

  try {
    const stream = logger.createReadStream()

    for await (const chunk of stream) {
      const content = chunk.toString()
      if (content.includes(pattern)) {
        console.error(content)
      }
    }
  }
  catch (error) {
    console.error('Search error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function handleClear(logger: Logger, options: CliOptions): Promise<void> {
  const { level: _level, name, before } = options

  try {
    if (!options.force) {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      const answer = await new Promise<string>((resolve) => {
        readline.question('Are you sure you want to clear logs? [y/N] ', resolve)
      })

      readline.close()

      if (answer.toLowerCase() !== 'y')
        return
    }

    await logger.clear({
      name,
      before: before ? new Date(before) : undefined,
    })
  }
  catch (error) {
    console.error('Clear error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function handleConfig(
  action: ConfigAction,
  options: CliOptions,
  handlers: ConfigHandlers,
): Promise<void> {
  const { key, value, format = 'json' } = options

  try {
    const config = await handlers.load()

    switch (action) {
      case 'get':
        if (!key) {
          console.error('Key is required for get action')
          process.exit(1)
        }
        console.error(config[key])
        break

      case 'set':
        if (!key || !value) {
          console.error('Key and value are required for set action')
          process.exit(1)
        }
        config[key] = value
        await handlers.save(config)
        console.error(`Set ${key}=${value}`)
        break

      case 'list':
        if (format === 'json')
          console.error(JSON.stringify(config, null, 2))
        else
          console.error(stringify(config))
        break

      case 'reset':
        await handlers.save({})
        console.error('Configuration reset to defaults')
        break

      default:
        console.error('Invalid action:', action)
        process.exit(1)
    }
  }
  catch (error) {
    console.error('Config error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
