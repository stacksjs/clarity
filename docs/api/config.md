# Config

The config module provides functionality for configuring the Clarity logging system, including default settings and configuration loading.

## Default Configuration

Clarity comes with sensible default settings that work out of the box. The default configuration is defined in the `defaultConfig` object:

```ts
import { defaultConfig } from 'clarity'

// Default config includes:
// - Log level: info
// - Default logger name: clarity
// - Timestamps enabled
// - Colors enabled
// - Text format
// - 10MB max log size
// - Daily rotation
// - Logs stored in <project_root>/logs
```

## Configuration Structure

The configuration follows the `ClarityConfig` interface, which includes:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `level` | `LogLevel` | `'info'` | Default log level for all loggers |
| `defaultName` | `string` | `'clarity'` | Default name for new loggers |
| `timestamp` | `boolean` | `true` | Whether to include timestamps in logs |
| `colors` | `boolean` | `true` | Whether to use colors in console output |
| `format` | `'text'` \| `'json'` | `'text'` | Default output format |
| `maxLogSize` | `number` | `10485760` (10MB) | Maximum size of individual log files |
| `logDatePattern` | `string` | `'YYYY-MM-DD'` | Date pattern for log files |
| `logDirectory` | `string` | `'<project_root>/logs'` | Directory where logs are stored |
| `rotation` | `boolean` \| `RotationConfig` | See below | Log rotation settings |
| `verbose` | `boolean` | `false` | Whether to enable verbose output |

### Default Rotation Configuration

The default rotation configuration is:

```ts
{
  frequency: 'daily',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  compress: false,
  rotateHour: 0,
  rotateMinute: 0,
  rotateDayOfWeek: 0,
  rotateDayOfMonth: 1,
  encrypt: false,
}
```

## Loading Configuration

Clarity automatically loads configuration from various sources, with the following priority (highest to lowest):

1. Environment variables (e.g., `CLARITY_LOG_DIR`)
2. Configuration file (`clarity.config.js`, `clarity.config.ts`, etc.)
3. Default configuration

The configuration is loaded using the Bunfig library:

```ts
import { config } from 'clarity'

// Access the loaded configuration
console.log(`Log level: ${config.level}`)
console.log(`Log directory: ${config.logDirectory}`)
```

## Project Root Detection

The module includes a utility function to detect the project root:

```ts
function getProjectRoot(filePath?: string, options: { relative?: boolean } = {}): string
```

This function is used internally to resolve the default log directory and can be used to resolve paths relative to the project root.

## Environment Variables

You can use environment variables to override configuration:

| Environment Variable | Description |
|----------------------|-------------|
| `CLARITY_LOG_DIR` | Overrides the log directory |
| `CLARITY_VERBOSE` | Set to `'true'` to enable verbose mode |

## API Reference

### config

The loaded configuration object:

```ts
import { config } from 'clarity'

// Example usage
const logger = new Logger('myapp', {
  level: config.level,
  logDirectory: config.logDirectory,
})
```

### defaultConfig

The default configuration object:

```ts
import { defaultConfig } from 'clarity'

// Example: Create a custom config based on defaults
const customConfig = {
  ...defaultConfig,
  level: 'debug',
  format: 'json',
}
```

## Custom Configuration File

You can create a `clarity.config.js` or `clarity.config.ts` file in your project root to customize the configuration:

```ts
// clarity.config.ts
import type { ClarityConfig } from 'clarity'

const config: Partial<ClarityConfig> = {
  level: 'debug',
  format: 'json',
  logDirectory: './custom-logs',
  rotation: {
    frequency: 'daily',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    compress: true,
  },
}

export default config
```
