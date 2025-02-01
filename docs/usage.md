# Get Started

There are two ways of using clarity: _as a library or as a CLI._

## Library

Given the npm package is installed:

```ts
import { Logger } from 'clarity'

const logger = new Logger('parser')

// Basic logging
logger.info('Starting parser...')
logger.success('Document parsed successfully')
logger.warning('Legacy format detected')
logger.error('Failed to parse document')

// Performance tracking
const end = logger.info('Starting expensive operation...')
// ... do work ...
end('Operation completed') // automatically includes time taken

// Domain-specific logging
const parseLogger = logger.extend('json')
parseLogger.info('Parsing JSON...') // outputs with [parser:json] prefix

// Debug mode
logger.debug('Additional debug information')

// Format string support
logger.info('Found %d errors in %s', 3, 'document.txt')

// Conditional execution
logger.only(() => {
  // Only runs when logging is enabled
  logger.info('Additional diagnostics...')
})
```

## CLI

```bash
# Watch logs in real-time
clarity watch --level debug --name "parser:*"
clarity watch --json --timestamp

# Log a one-off message
clarity log "Starting deployment" --level info --name "deploy"

# Export logs to a file
clarity export --format json --output logs.json --level error
clarity export --start 2024-01-01 --end 2024-01-31

# Show and follow last N lines
clarity tail --lines 50 --level error --follow
clarity tail --name "api:*"

# Search through logs
clarity search "error connecting to database" --level error
clarity search "deployment" --start 2024-01-01 --case-sensitive

# Clear log history
clarity clear --level debug --before 2024-01-01
clarity clear --name "temp:*"

# Manage configuration
clarity config set --level debug
clarity config list

# Utility commands
clarity --help    # Show help information
clarity --version # Show version number
```

All commands support the following common options:

- `--level`: Filter by log level (debug, info, warning, error)
- `--name`: Filter by logger name (supports patterns like "parser:*")
- `--verbose`: Enable verbose output

### Command Reference

- `watch`: Monitor logs in real-time with filtering and formatting options
- `log`: Send one-off log messages with specified level and name
- `export`: Save logs to a file in various formats with date range filtering
- `tail`: Show and optionally follow the last N lines of logs
- `search`: Search through logs using patterns with date range and case sensitivity options
- `clear`: Clear log history with level, name, and date filtering
- `config`: Manage clarity configuration (get, set, list)
