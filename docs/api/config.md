# Config API Reference

Clarity provides a configuration system that allows you to control logging behavior through a `ClarityConfig` object.

## Configuration Interface

The core configuration interface defines all available options:

```ts
interface ClarityConfig {
  /**
   * Default log level
   * @default 'info'
   */
  level: LogLevel

  /**
   * Default logger name
   * @default 'clarity'
   */
  defaultName: string

  /**
   * Show timestamps in logs
   * @default true
   */
  timestamp: boolean

  /**
   * Enable colored output
   * @default true
   */
  colors: boolean

  /**
   * Default output format
   * @default 'text'
   */
  format: 'text' | 'json'

  /**
   * Maximum size of log files in bytes before rotation
   * @default 10485760 // (10MB)
   */
  maxLogSize: number

  /**
   * Date pattern for rotated files
   * @default 'YYYY-MM-DD'
   */
  logDatePattern: string

  /**
   * Directory to store log files
   * If not specified, defaults to {project_root}/logs
   */
  logDirectory: string

  /**
   * Log rotation configuration
   */
  rotation: boolean | RotationConfig

  /**
   * Enable verbose output
   * @default false
   */
  verbose: boolean
}
```

## Default Configuration

Clarity provides sensible defaults that you can override as needed:

```ts
export const defaultConfig: ClarityConfig = {
  level: 'info',
  defaultName: 'clarity',
  timestamp: true,
  colors: true,
  format: 'text',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: defaultLogDirectory, // logs folder in project root
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    compress: false,
    rotateHour: 0,
    rotateMinute: 0,
    rotateDayOfWeek: 0,
    rotateDayOfMonth: 1,
    encrypt: false,
  },
  verbose: false,
}
```

## Rotation Configuration

The `RotationConfig` interface provides detailed control over log rotation:

```ts
interface RotationConfig {
  /** Maximum file size in bytes before rotation */
  maxSize?: number

  /** Maximum number of rotated files to keep */
  maxFiles?: number

  /** Maximum log age in days before deletion */
  maxAge?: number

  /** Whether to compress rotated files */
  compress?: boolean

  /** Time-based rotation frequency */
  frequency?: 'daily' | 'weekly' | 'monthly'

  /** Hour of the day to perform rotation (0-23) */
  rotateHour?: number

  /** Minute of the hour to perform rotation (0-59) */
  rotateMinute?: number

  /** Day of week for weekly rotation (0-6, 0 is Sunday) */
  rotateDayOfWeek?: number

  /** Day of month for monthly rotation (1-31) */
  rotateDayOfMonth?: number

  /** Custom log file name pattern */
  pattern?: string

  /** Enable encryption of rotated files */
  encrypt?: EncryptionConfig | boolean

  /** Key rotation configuration */
  keyRotation?: {
    enabled?: boolean
    interval?: number
    maxKeys?: number
  }
}
```

## Encryption Configuration

Configure log file encryption with the `EncryptionConfig` interface:

```ts
interface EncryptionConfig {
  /** Encryption algorithm to use */
  algorithm?: 'aes-256-cbc' | 'aes-256-gcm' | 'chacha20-poly1305'

  /** Key identifier for managing multiple encryption keys */
  keyId?: string

  /** Whether to compress data before encryption */
  compress?: boolean

  /** Key rotation configuration */
  keyRotation?: {
    enabled: boolean
    interval: number // in days
    maxKeys: number
  }
}
```

## Loading Configuration

Clarity loads configuration from:

1. Defaults
2. Configuration file (clarity.config.js/ts/json)
3. Environment variables
4. Programmatic overrides

```ts
// Configuration is loaded at initialization
import { config } from 'clarity'

// Access configuration values
console.log(config.level) // 'info'
console.log(config.logDirectory) // '/path/to/logs'
```

## Environment Variables

Clarity supports configuration through environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `CLARITY_LOG_LEVEL` | Default log level | `CLARITY_LOG_LEVEL=debug` |
| `CLARITY_LOG_DIR` | Directory for log files | `CLARITY_LOG_DIR=/var/logs/app` |
| `CLARITY_FORMAT` | Default log format | `CLARITY_FORMAT=json` |
| `CLARITY_TIMESTAMP` | Enable timestamps | `CLARITY_TIMESTAMP=false` |
| `CLARITY_COLORS` | Enable colors | `CLARITY_COLORS=false` |
| `CLARITY_VERBOSE` | Enable verbose output | `CLARITY_VERBOSE=true` |

## Project Root Detection

Clarity includes utilities for finding the project root:

```ts
function getProjectRoot(filePath?: string, options: { relative?: boolean } = {}): string
```

This function:

- Finds the directory containing your application's package.json
- Optionally accepts a sub-path to join with the root
- Can return absolute or relative paths

## Configuration File

Clarity supports loading configuration from a configuration file using [bunfig](https://github.com/wobsoriano/bunfig):

```ts
// clarity.config.ts
export default {
  level: 'debug',
  rotation: {
    frequency: 'daily',
    compress: true,
  },
  logDirectory: './app/logs',
}
```

The configuration system provides flexibility while maintaining sensible defaults for a smooth logging experience.
