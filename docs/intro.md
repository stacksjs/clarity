<p align="center"><img src="https://github.com/stacksjs/rpx/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of this repo"></p>

# clarity

> A modern `debug` client for TypeScript, offering powerful logging capabilities with colored output, performance tracking, and both CLI & library support.

## Features

- 🎨 Rich Colored Output
- ⚡ Performance Tracking
- 📊 Multiple Log Levels
- 🎯 Domain-specific Logging
- 🛠️ CLI & Library Support
- 🌐 Browser & Server Compatible
- 💪 TypeScript Support

# Introduction

Clarity is a modern logging client for TypeScript and Bun, offering powerful features for both development and production environments.

## Key Features

### 🎨 Rich Colored Output

```ts
const logger = new Logger('app')

logger.info('Starting application...')    // Blue output
logger.success('Setup complete')          // Green output
logger.warning('Cache miss')              // Yellow output
logger.error('Connection failed')         // Red output
```

### ⚡ Performance Tracking

```ts
const logger = new Logger('performance')
const end = logger.info('Starting expensive operation...')

// ... do work ...

end('Operation completed') // automatically includes time taken
```

### 🔍 Domain-specific Logging

```ts
const logger = new Logger('api')
const authLogger = logger.extend('auth')
const dbLogger = logger.extend('db')

authLogger.info('User authenticated')     // [api:auth] info
dbLogger.warning('Connection slow')       // [api:db] warning
```

### 📊 Log Management

```bash
# Watch logs in real-time
clarity watch --level error --name "api:*"

# Search through logs
clarity search "connection failed" --level error

# Export logs
clarity export --format json --output logs.json

# Follow last 50 lines
clarity tail --lines 50 --follow
```

## Installation

```bash
bun install -d clarity
```

## Quick Start

### Basic Usage

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

logger.info('Application starting...')
logger.success('Server listening on port 3000')

try {
  // ... some operation
}
catch (error) {
  logger.error('Failed to start server:', error)
}
```

### Advanced Features

```ts
// Performance tracking
const end = logger.info('Starting database migration...')
await runMigrations()
end('Migration completed')

// Domain-specific logging
const dbLogger = logger.extend('db')
const authLogger = logger.extend('auth')

dbLogger.info('Connected to database')
authLogger.warning('Rate limit reached')

// Debug mode for development
logger.debug('SQL query:', query)
```

### Using the CLI

```bash
# Watch logs in real-time
clarity watch --level debug --name "api:*"

# Export error logs
clarity export --level error --output errors.json

# Search through logs
clarity search "failed to connect" --level error

# Show and follow last 50 lines
clarity tail --lines 50 --follow

# Clear old logs
clarity clear --before 2024-01-01

# Manage configuration
clarity config set --level debug
```

Ready to dive deeper? Check out our [CLI Guide](./cli) or [Configuration Guide](./config) for more details.

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/clarity/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/clarity/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Two things are true: Stacks OSS will always stay open-source, and we do love to receive postcards from wherever Stacks is used! _We also publish them on our website._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [debug](https://github.com/debug-js/debug)
- [@open-draft/logger](https://github.com/open-draft/logger)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/rpx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/rpx -->
