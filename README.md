<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# clarity

> A modern `debug` client for TypeScript, offering powerful logging capabilities with colored output, performance tracking, log rotation, and both CLI & library support.

## Features

- 🚀 **Performance** _High-Performance Logging_
- 🎯 **Domain-Specific** _Domain-Specific Namespaces_
- 🤞 **Buffering** _Fingers-Crossed Log Buffering_
- 🔄 **Rotation** _Automatic Log Rotation & Cleanup_
- 🔐 **Encryption** _Encrypted Log Storage_

### Output & Formatting

- 🎨 **Rich Color-Coded** _Console Output_
- 📊 **Multiple Log Levels** _`debug`, `info`, `success`, `warn`, `error`_
- 🔠 **Format String Support** _`%s`, `%d`, `%j`, etc._
- ⚡ **Built-in Performance Tracking** _`start`, `end`, `time`_

### Platform Support

- 🌐 **Universal** _Browser & Server support_
- 🛠️ **CLI & Library** _Access APIs via CLI or programmatically_
- 💻 **Fully Typed** _First-Class TypeScript support_
- 📦 **Lightweight** _Zero external dependencies_

## Install

```bash
bun install clarity
npm install clarity
```

## Get Started

There are two ways of using clarity: _as a library or as a CLI._

### Library

Given the npm package is installed:

```ts
import { Logger } from 'clarity'

// Configure the logger
const logger = new Logger('parser', {
  // Optional configuration
  maxLogSize: 5 * 1024 * 1024, // 5MB

  rotation: {
    maxLogFiles: 10,
    compress: true,
  },

  encrypted: true,
})

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

_To learn more about the Library usage, please refer to the [Library documentation](https://stacks-clarity.netlify.app/library)._

### Common Usage Examples

#### Basic Logging with Different Levels

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Different log levels
await logger.debug('Debug information for developers')
await logger.info('General information about application state')
await logger.success('Operation completed successfully')
await logger.warn('Warning: approaching rate limit')
await logger.error('Failed to connect to database')
```

#### Performance Tracking

```ts
import { Logger } from 'clarity'

const logger = new Logger('performance')

// Track operation duration
const end = logger.time('Starting database query')
await db.query('SELECT * FROM users')
await end() // Outputs: "Starting database query completed in 123ms"

// Track multiple operations
const end1 = logger.time('Operation 1')
const end2 = logger.time('Operation 2')
await Promise.all([
  someAsyncOperation().then(end1),
  anotherAsyncOperation().then(end2)
])
```

#### Domain-Specific Logging

```ts
import { Logger } from 'clarity'

const logger = new Logger('api')

// Create sub-loggers for specific domains
const authLogger = logger.extend('auth')
const dbLogger = logger.extend('database')
const cacheLogger = logger.extend('cache')

await authLogger.info('User authenticated') // [api:auth] User authenticated
await dbLogger.error('Connection failed') // [api:database] Connection failed
await cacheLogger.debug('Cache miss') // [api:cache] Cache miss
```

#### Advanced Configuration

```ts
import { Logger } from 'clarity'

const logger = new Logger('app', {
  // Log level and format
  level: 'debug',
  format: 'json',
  timestamp: new Date(),

  // Log rotation settings
  rotation: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    frequency: 'daily',
    compress: true,
  },

  // Fingers-crossed buffering
  fingersCrossed: {
    activationLevel: 'error',
    bufferSize: 50,
    flushOnDeactivation: true,
  }
})
```

#### Structured Logging

```ts
import { Logger } from 'clarity'

const logger = new Logger('api', { format: 'json' })

// Log structured data
await logger.info('User action', {
  userId: 123,
  action: 'login',
  timestamp: new Date(),
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
})

// Log errors with stack traces
try {
  throw new Error('Database connection failed')
}
catch (error) {
  await logger.error('Failed to execute query', {
    error: error.message,
    stack: error.stack,
    query: 'SELECT * FROM users'
  })
}
```

#### Conditional Logging

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Only execute logging code if the level is enabled
logger.only(() => {
  const expensiveOperation = calculateSomething()
  logger.debug('Operation result:', expensiveOperation)
})

// Conditional logging with levels
if (logger.shouldLog('debug')) {
  const metrics = gatherMetrics() // expensive operation
  await logger.debug('System metrics:', metrics)
}
```

### CLI

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

# Configure log rotation
clarity config set --key maxLogSize --value 5242880  # 5MB
clarity config set --key maxLogFiles --value 10
clarity config set --key compressLogs --value true

# Other configuration
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

#### Command Reference

- `watch`: Monitor logs in real-time with filtering and formatting options
- `log`: Send one-off log messages with specified level and name
- `export`: Save logs to a file in various formats with date range filtering
- `tail`: Show and optionally follow the last N lines of logs
- `search`: Search through logs using patterns with date range and case sensitivity options
- `clear`: Clear log history with level, name, and date filtering
- `config`: Manage clarity configuration (get, set, list)

_To learn more about the CLI usage, please refer to the [CLI documentation](https://stacks-clarity.netlify.app/cli)._

## Configuration

Clarity can be configured programmatically, using environment variables, or through the CLI:

### Programmatic Configuration

```typescript
import { Logger } from 'clarity'

const logger = new Logger('app', {
  // Log Levels
  level: 'debug',
  defaultName: 'app',
  verbose: true,

  // Output Format
  format: 'json',
  timestamp: true,
  colors: true,

  // Log Rotation
  rotation: {
    frequency: 'daily',
    maxLogSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,
    compress: true,
  },

  encrypt: true,
  logDirectory: '~/.clarity/logs',
})
```

### Environment Variables

```bash
# Enable logging
DEBUG=true
DEBUG=parser # enable specific logger
DEBUG=parser:* # enable logger and all subdomains

# Control log level
LOG_LEVEL=debug # show all logs
LOG_LEVEL=error # show only errors
```

### CLI Configuration

```bash
# Configure logging
clarity config set --key level --value debug
clarity config set --key maxLogSize --value 5242880 # 5MB
```

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/clarity/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](https://github.com/stacksjs/stacks/blob/main/.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/clarity/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where `clarity` is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [debug](https://github.com/debug-js/debug)
- [@open-draft/logger](https://github.com/open-draft/logger)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/clarity/contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/clarity/blob/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/clarity?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/clarity
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/clarity/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/clarity/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/clarity/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/clarity -->
