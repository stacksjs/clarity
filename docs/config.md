# Configuration

Clarity can be configured in multiple ways:

1. Programmatically through the `ClarityConfig` interface
2. Using environment variables
3. Through the CLI config system

## Programmatic Configuration

When using Clarity as a library, you can configure it by providing options when creating a new logger or setting global configuration:

```typescript
import type { ClarityConfig } from 'clarity'
import { Logger } from 'clarity'

// Global configuration
const config: ClarityConfig = {
  verbose: true,
  level: 'debug',
  maxLogSize: 5 * 1024 * 1024, // 5MB
  maxLogFiles: 10,
  compressLogs: true,
  logDirectory: '/custom/log/path',
  colors: true,
  timestamp: true
}

// Per-logger configuration
const logger = new Logger('app', {
  level: 'debug',
  format: 'json',
  timestamp: true
})
```

### Configuration Options

- **Basic Settings**
  - `verbose`: Enable verbose output (default: false)
  - `level`: Default log level ('debug' | 'info' | 'success' | 'warning' | 'error')
  - `defaultName`: Default logger name (default: 'app')
  - `format`: Default output format ('text' | 'json')

- **Output Formatting**
  - `json`: Use JSON output format (default: false)
  - `timestamp`: Show timestamps in logs (default: true)
  - `colors`: Enable colored output (default: true)

- **Log Rotation**
  - `maxLogSize`: Maximum size of log files in bytes before rotation (default: 10MB)
  - `maxLogFiles`: Number of rotated files to keep (default: 5)
  - `compressLogs`: Enable gzip compression for rotated files (default: true)
  - `logDatePattern`: Date pattern for rotated files (default: 'YYYY-MM-DD')
  - `logDirectory`: Custom directory for storing log files (default: ~/.clarity/logs)

## Environment Variables

```bash
# Enable logging
DEBUG=true
DEBUG=parser # enable specific logger
DEBUG=parser:* # enable logger and all subdomains

# Control log level
LOG_LEVEL=debug # show all logs
LOG_LEVEL=error # show only errors
```

## CLI Configuration

Use the `clarity config` command to manage settings:

```bash
# View all settings
clarity config list

# Get a specific setting
clarity config get --key level

# Set a configuration value
clarity config set --key maxLogSize --value 5242880
```

## Configuration Precedence

Configuration options are applied in the following order (later ones override earlier ones):

1. Default values
2. Environment variables
3. Global configuration
4. Per-logger options
5. CLI configuration (when using the CLI)
