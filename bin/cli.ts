import { CAC } from 'cac'
import { version } from '../package.json'

const cli = new CAC('clarity')

interface WatchOptions {
  level?: 'debug' | 'info' | 'warning' | 'error'
  name?: string
  verbose?: boolean
  json?: boolean
  timestamp?: boolean
}

interface LogOptions {
  level?: 'debug' | 'info' | 'success' | 'warning' | 'error'
  name?: string
  verbose?: boolean
}

// Watch command - for monitoring logs in real-time
cli
  .command('watch', 'Watch logs in real-time')
  .option('--level <level>', 'Log level to watch (debug, info, warning, error)')
  .option('--name <name>', 'Filter logs by logger name (supports patterns like "parser:*")')
  .option('--verbose', 'Enable verbose output')
  .option('--json', 'Output logs in JSON format')
  .option('--timestamp', 'Show timestamps in logs')
  .example('clarity watch --level debug --name "parser:*"')
  .action(async (options: WatchOptions) => {
    // Implementation will go here
    console.log('Watching logs with options:', options)
  })

// Log command - for one-off logging
cli
  .command('log <message>', 'Log a message')
  .option('--level <level>', 'Log level (debug, info, success, warning, error)', { default: 'info' })
  .option('--name <name>', 'Logger name', { default: 'cli' })
  .option('--verbose', 'Enable verbose output')
  .example('clarity log "Starting deployment" --level info --name "deploy"')
  .action(async (message: string, options: LogOptions) => {
    // Implementation will go here
    console.log('Logging message with options:', { message, options })
  })

// Config command - for managing configuration
cli
  .command('config', 'Manage clarity configuration')
  .option('set', 'Set a configuration value')
  .option('get', 'Get a configuration value')
  .option('list', 'List all configuration values')
  .example('clarity config set --level debug')
  .action(async (options) => {
    // Implementation will go here
    console.log('Managing config with options:', options)
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
