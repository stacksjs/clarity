import { CAC } from 'cac'
import { version } from '../../package.json'
import { logManager } from '../storage/log-manager'
import { handleConfig } from './config-handler'
import {
  handleClear,
  handleExport,
  handleLog,
  handleSearch,
  handleTail,
  handleWatch,
} from './handlers'

export async function createCli(): Promise<CAC> {
  const cli = new CAC('clarity')

  // Initialize log manager
  await logManager.initialize()

  // Watch command
  cli
    .command('watch', 'Watch logs in real-time')
    .option('--level <level>', 'Log level to watch (debug, info, warning, error)')
    .option('--name <name>', 'Filter logs by logger name (supports patterns like "parser:*")')
    .option('--verbose', 'Enable verbose output')
    .option('--json', 'Output logs in JSON format')
    .option('--timestamp', 'Show timestamps in logs')
    .example('clarity watch --level debug --name "parser:*"')
    .action(handleWatch)

  // Log command
  cli
    .command('log <message>', 'Log a message')
    .option('--level <level>', 'Log level (debug, info, success, warning, error)', { default: 'info' })
    .option('--name <name>', 'Logger name', { default: 'cli' })
    .option('--verbose', 'Enable verbose output')
    .example('clarity log "Starting deployment" --level info --name "deploy"')
    .action(handleLog)

  // Export command
  cli
    .command('export', 'Export logs to a file')
    .option('--format <format>', 'Output format (json or text)', { default: 'text' })
    .option('--output <file>', 'Output file path')
    .option('--level <level>', 'Filter by log level')
    .option('--name <name>', 'Filter by logger name')
    .option('--start <date>', 'Start date for export (ISO format)')
    .option('--end <date>', 'End date for export (ISO format)')
    .example('clarity export --format json --output logs.json --level error')
    .action(handleExport)

  // Tail command
  cli
    .command('tail', 'Show the last N lines of logs')
    .option('--lines <n>', 'Number of lines to show', { default: 10 })
    .option('--level <level>', 'Filter by log level')
    .option('--name <name>', 'Filter by logger name')
    .option('--follow', 'Follow log output in real time')
    .example('clarity tail --lines 50 --level error --follow')
    .action(handleTail)

  // Search command
  cli
    .command('search <pattern>', 'Search through logs')
    .option('--level <level>', 'Filter by log level')
    .option('--name <name>', 'Filter by logger name')
    .option('--start <date>', 'Start date for search (ISO format)')
    .option('--end <date>', 'End date for search (ISO format)')
    .option('--case-sensitive', 'Enable case-sensitive search')
    .example('clarity search "error connecting to database" --level error')
    .action(handleSearch)

  // Clear command
  cli
    .command('clear', 'Clear log history')
    .option('--level <level>', 'Clear specific log level only')
    .option('--name <name>', 'Clear specific logger only')
    .option('--before <date>', 'Clear logs before date (ISO format)')
    .example('clarity clear --level debug --before 2024-01-01')
    .action(handleClear)

  // Config command
  cli
    .command('config <action>', 'Manage clarity configuration')
    .option('--key <key>', 'Configuration key')
    .option('--value <value>', 'Configuration value (for set action)')
    .example('clarity config set --key level --value debug')
    .example('clarity config get --key level')
    .example('clarity config list')
    .action(async (action: 'get' | 'set' | 'list', options) => {
      await handleConfig({
        action,
        key: options.key,
        value: options.value,
      })
    })

  // Standard commands
  cli.help()
  cli.version(version)

  return cli
}
