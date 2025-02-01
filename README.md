<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

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

#### Command Reference

- `watch`: Monitor logs in real-time with filtering and formatting options
- `log`: Send one-off log messages with specified level and name
- `export`: Save logs to a file in various formats with date range filtering
- `tail`: Show and optionally follow the last N lines of logs
- `search`: Search through logs using patterns with date range and case sensitivity options
- `clear`: Clear log history with level, name, and date filtering
- `config`: Manage clarity configuration (get, set, list)

## Configuration

Clarity can be configured using environment variables or global variables in the browser:

```bash
# Enable logging
DEBUG=true
DEBUG=parser # enable specific logger
DEBUG=parser:* # enable logger and all subdomains

# Control log level
LOG_LEVEL=debug # show all logs
LOG_LEVEL=error # show only errors
```

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
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/clarity?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/clarity
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/clarity/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/clarity/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/clarity/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/clarity -->
