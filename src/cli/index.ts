import type { CAC } from 'cac'
import type { Logger } from '../logger'
import type { CliOptions, LogOptions } from './types'
import { cac } from 'cac'
import { Logger as LoggerClass } from '../logger'
import { loadConfig, saveConfig } from './config-handler'
import { handleClear, handleConfig, handleExport, handleLog, handleSearch, handleTail, handleWatch } from './handler'

export async function createCli(options: { logDirectory?: string } = {}): Promise<CAC> {
  const cli = cac('clarity')
  const logger = new LoggerClass('cli', {
    logDirectory: options.logDirectory,
    level: 'debug', // Set debug level to ensure all logs are captured
  })

  // Watch command
  cli
    .command('watch', 'Monitor logs in real-time')
    .option('--level <level>', 'Filter by log level')
    .option('--name <pattern>', 'Filter by logger name')
    .option('--json', 'Output in JSON format')
    .option('--timestamp', 'Include timestamps')
    .option('--color', 'Enable colored output')
    .option('--verbose', 'Show detailed information')
    .action(async (options: CliOptions) => {
      await handleWatch(logger, options)
    })

  // Log command
  cli
    .command('log <message>', 'Send one-off log messages')
    .option('--level <level>', 'Log level', { default: 'info' })
    .option('--name <n>', 'Logger name')
    .option('--json', 'Use JSON format')
    .option('--meta <json>', 'Add metadata as JSON')
    .action(async (message: string, options: LogOptions) => {
      console.error('Debug: CLI log command called with:', { message, options })
      await handleLog(logger, message, options)
    })

  // Export command
  cli
    .command('export', 'Export logs to a file')
    .option('--format <format>', 'Output format (json|text|csv)')
    .option('--output <file>', 'Output file path')
    .option('--level <level>', 'Filter by log level')
    .option('--name <pattern>', 'Filter by logger name')
    .option('--start <date>', 'Start date (ISO format)')
    .option('--end <date>', 'End date (ISO format)')
    .option('--compress', 'Compress output file')
    .action(async (options: CliOptions) => {
      await handleExport(logger, options)
    })

  // Tail command
  cli
    .command('tail', 'View and follow log output')
    .option('--lines <n>', 'Number of lines', { default: 10 })
    .option('--follow', 'Follow log output')
    .option('--level <level>', 'Filter by log level')
    .option('--name <pattern>', 'Filter by logger name')
    .option('--color', 'Enable colored output')
    .action(async (options: CliOptions) => {
      await handleTail(logger, options)
    })

  // Search command
  cli
    .command('search <pattern>', 'Search through logs')
    .option('--level <level>', 'Filter by log level')
    .option('--name <pattern>', 'Filter by logger name')
    .option('--start <date>', 'Start date')
    .option('--end <date>', 'End date')
    .option('--case-sensitive', 'Enable case-sensitive search')
    .option('--context <n>', 'Show n lines of context')
    .action(async (pattern: string, options: CliOptions) => {
      await handleSearch(logger, pattern, options)
    })

  // Clear command
  cli
    .command('clear', 'Clear log history')
    .option('--level <level>', 'Clear specific log level')
    .option('--name <pattern>', 'Clear specific logger')
    .option('--before <date>', 'Clear logs before date')
    .option('--dry-run', 'Show what would be deleted')
    .option('--force', 'Skip confirmation')
    .action(async (options: CliOptions) => {
      await handleClear(logger, options)
    })

  // Config command
  cli
    .command('config <action>', 'Manage configuration')
    .option('--key <key>', 'Configuration key')
    .option('--value <value>', 'Configuration value')
    .option('--format <fmt>', 'Output format (json|yaml)')
    .action(async (action: string, options: CliOptions) => {
      await handleConfig(action as any, options, { load: loadConfig, save: saveConfig })
    })

  // Global options
  cli
    .option('--config <file>', 'Use specific config file')
    .option('--quiet', 'Suppress output')
    .option('--debug', 'Enable debug output')
    .option('--no-color', 'Disable colored output')
    .help()
    .version('1.0.0')

  return cli
}

export type { CliOptions, Logger, LogOptions }
