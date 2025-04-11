# Advanced Configuration

Clarity offers detailed configuration options to fine-tune logging behavior for various environments and use cases. This guide explains advanced configuration strategies and techniques.

## Configuration Layers

Clarity implements a layered configuration system:

1. **Default configuration** - Sensible defaults that work out of the box
2. **Environment variables** - Override defaults through environment settings
3. **Configuration files** - Project-specific configuration files
4. **Instance configuration** - Per-logger instance options

This layered approach allows for global settings while enabling customization for specific components.

## Using Configuration Files

Clarity uses [bunfig](https://github.com/wobsoriano/bunfig) to support multiple configuration file formats:

```ts
// clarity.config.ts
import type { ClarityConfig } from 'clarity'

const config: Partial<ClarityConfig> = {
  level: 'debug',
  format: 'json',
  rotation: {
    frequency: 'daily',
    maxSize: 5 * 1024 * 1024, // 5MB
    compress: true,
  },
}

export default config
```

### Supported File Types

- TypeScript: `clarity.config.ts`
- JavaScript: `clarity.config.js`
- JSON: `clarity.config.json`
- Package.json: Include a `clarity` property

### Configuration File Location

Clarity automatically searches for configuration files in:

1. Current working directory
2. Project root directory
3. User's home directory (for global settings)

## Environment Variables

Environment variables provide a way to configure Clarity without modifying code:

```bash
# Set log level
export CLARITY_LOG_LEVEL=debug

# Set log directory
export CLARITY_LOG_DIR=/var/log/myapp

# Enable verbose mode
export CLARITY_VERBOSE=true

# Disable colored output
export CLARITY_COLORS=false

# Set output format
export CLARITY_FORMAT=json

# Disable timestamps
export CLARITY_TIMESTAMP=false
```

Environment variables take precedence over configuration files.

## Dynamic Configuration

For applications that need to change logging behavior at runtime:

```ts
import { config as globalConfig, Logger } from 'clarity'

// Create logger with initial configuration
const logger = new Logger('app', {
  level: 'info',
})

// Update logging level dynamically
function setDebugMode(enabled: boolean) {
  logger.setLevel(enabled ? 'debug' : 'info')
}

// Update global configuration
function updateGlobalConfig(newConfig) {
  Object.assign(globalConfig, newConfig)
}
```

## Environment-Specific Configuration

Configure Clarity differently based on the runtime environment:

```ts
import { Logger } from 'clarity'
import { isDevelopment, isProduction, isTest } from './env-helpers'

// Base config
const baseConfig = {
  defaultName: 'myapp',
  timestamp: true,
}

// Environment-specific settings
const envConfig = isDevelopment()
  ? {
      level: 'debug',
      format: 'text',
      fancy: true,
    }
  : isTest()
    ? {
        level: 'error', // Only log errors in tests
        format: 'json',
        enabled: process.env.LOG_IN_TESTS === 'true',
      }
    : isProduction()
      ? {
          level: 'info',
          format: 'json',
          rotation: {
            frequency: 'daily',
            maxSize: 10 * 1024 * 1024,
            maxFiles: 30,
            compress: true,
          },
        }
      : {}

// Create logger with merged config
const logger = new Logger('app', {
  ...baseConfig,
  ...envConfig,
})
```

## Configuration Objects

### Complete Configuration Example

```ts
import type { ClarityConfig } from 'clarity'

const completeConfig: ClarityConfig = {
  // Log level determines which messages are recorded
  level: 'info',

  // Default name for loggers created without explicit names
  defaultName: 'clarity',

  // Whether to include timestamps in log output
  timestamp: true,

  // Whether to use colors in console output
  colors: true,

  // Default output format (text or JSON)
  format: 'text',

  // Maximum size of individual log files in bytes
  maxLogSize: 10 * 1024 * 1024, // 10MB

  // Date pattern for rotated log files
  logDatePattern: 'YYYY-MM-DD',

  // Directory to store log files
  logDirectory: './logs',

  // Log rotation configuration
  rotation: {
    // Time-based rotation
    frequency: 'daily',
    rotateHour: 0,
    rotateMinute: 0,
    rotateDayOfWeek: 0, // Sunday
    rotateDayOfMonth: 1,

    // Size-based rotation
    maxSize: 10 * 1024 * 1024, // 10MB

    // Retention policy
    maxFiles: 7,
    maxAge: 30, // days

    // Compression
    compress: true,

    // File pattern
    pattern: '%DATE%.log',

    // Encryption
    encrypt: {
      algorithm: 'aes-256-gcm',
      compress: true,
      keyRotation: {
        enabled: true,
        interval: 7, // days
        maxKeys: 5,
      },
    },
  },

  // Whether to enable verbose output
  verbose: false,
}
```

### Rotation Configuration

```ts
import type { RotationConfig } from 'clarity'

const rotationConfig: RotationConfig = {
  // Time-based rotation options
  frequency: 'daily', // 'hourly', 'daily', 'weekly', 'monthly', or 'none'
  rotateHour: 0, // Hour of day to rotate (0-23)
  rotateMinute: 0, // Minute of hour to rotate (0-59)
  rotateDayOfWeek: 0, // Day of week to rotate on (0=Sunday, 6=Saturday)
  rotateDayOfMonth: 1, // Day of month to rotate on (1-31)

  // Size-based rotation
  maxSize: 10 * 1024 * 1024, // Rotate when file exceeds this size (bytes)

  // Retention options
  maxFiles: 10, // Maximum number of rotated files to keep
  maxAge: 30, // Maximum age of rotated files in days

  // Compression
  compress: true, // Compress rotated files with gzip

  // Custom filename pattern
  pattern: '%DATE%.log', // Uses date pattern from config

  // Encryption options
  encrypt: true, // Enable encryption with default settings
  // OR
  encrypt: {
    algorithm: 'aes-256-gcm', // Encryption algorithm
    compress: true, // Compress before encrypting
    keyRotation: {
      enabled: true, // Enable key rotation
      interval: 30, // Rotate keys every 30 days
      maxKeys: 3, // Keep up to 3 previous keys
    },
  },
}
```

### Extended Logger Options

```ts
import type { ExtendedLoggerOptions } from 'clarity'

const loggerOptions: ExtendedLoggerOptions = {
  // Log level
  level: 'debug',

  // Output format
  format: 'json',

  // Log directory
  logDirectory: './logs',

  // Rotation config
  rotation: { /* see rotation config example */ },

  // Custom formatter
  formatter: customFormatter,

  // Terminal output options
  fancy: true, // Enable fancy terminal output
  showTags: true, // Show namespace tags in output
  tagFormat: { prefix: '[', suffix: ']' }, // Format for namespace tags
  timestampPosition: 'right', // Position timestamp on right side

  // Fingers-crossed mode (buffer logs until error occurs)
  fingersCrossedEnabled: true,
  fingersCrossed: {
    activationLevel: 'error', // Level that triggers log flushing
    bufferSize: 100, // Maximum number of entries to buffer
    flushOnDeactivation: true, // Flush buffer when deactivated
    stopBuffering: false, // Stop buffering after activation
  },

  // Enable/disable logging
  enabled: true,
}
```

## Configuration Best Practices

1. **Use environment-specific configurations**
   - Debug level in development
   - Info or higher in production
   - Minimal logging in tests

2. **Set appropriate log rotation**
   - Daily rotation for most applications
   - Size-based rotation for high-volume logs
   - Keep enough history without wasting storage

3. **Use JSON format in production**
   - Machine-parseable for log analysis tools
   - Contains structured data for filtering

4. **Enable encryption for sensitive logs**
   - Use for logs containing personal data
   - Configure key rotation for enhanced security

5. **Create namespaced loggers**
   - Use logger.extend() for component-specific logging
   - Helps filter logs by component

6. **Leverage fingers-crossed mode**
   - Reduces disk I/O for normal operation
   - Ensures complete context when errors occur

7. **Configure log directory appropriately**
   - Use node-writeable directories in production
   - Consider log management and rotation policies

By mastering these advanced configuration techniques, you can tailor Clarity's behavior to suit your application's specific logging requirements.
