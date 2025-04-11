# Storage

Clarity provides robust storage mechanisms for log files and configuration management. This page focuses on storage-related functionality, particularly the configuration manager.

## ConfigManager

The `ConfigManager` is responsible for managing configuration storage, loading, and persistence. It handles:

- Loading configuration from files
- Storing configuration in memory
- Persisting configuration changes to disk
- Validating configuration values

```ts
import { ConfigManager } from 'clarity/storage'

// Initialize with a name and optional default config
const manager = new ConfigManager('clarity', {
  level: 'info',
  logDirectory: './logs',
})

// Access configuration
const config = await manager.getConfig()
console.log(config.level) // 'info'

// Update configuration
await manager.updateConfig({
  level: 'debug',
})
```

## Log File Storage

Clarity automatically manages log file storage in the configured log directory. By default, this is set to `<project_root>/logs`.

The path can be customized through:

1. Configuration options
2. Environment variables (`CLARITY_LOG_DIR`)
3. Programmatic setting

```ts
import { Logger } from 'clarity'

// Set custom log directory at creation time
const logger = new Logger('app', {
  logDirectory: './custom-logs',
})

// Get current log directory
const logDir = logger.getLogDirectory()
```

## File Locking

When writing logs to disk, Clarity implements file locking to prevent concurrent access issues:

- Uses file descriptors for exclusive access
- Implements proper synchronization when writing to files
- Ensures log entries are written atomically

## Log Rotation

Clarity supports automatic log rotation to manage log file sizes and retention:

```ts
import { Logger } from 'clarity'

// Configure rotation
const logger = new Logger('app', {
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 7,
    compress: true,
  },
})
```

Log files are rotated based on:

- Time (daily, weekly, monthly)
- Size (when exceeding a specified size)

Rotated files can be:

- Compressed (gzip)
- Encrypted
- Automatically cleaned up after reaching a maximum count

## Encryption

For sensitive logs, Clarity supports encryption:

```ts
import { Logger } from 'clarity'

// Set up encryption
const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      algorithm: 'aes-256-gcm',
      compress: true,
    },
  },
})
```

Encryption features include:

- AES-256 encryption (multiple algorithms supported)
- Automatic key management
- Optional compression before encryption
- Key rotation support

## Configuration Persistence

The configuration system supports persistence across application restarts:

```ts
import { ConfigManager } from 'clarity/storage'

// Initialize config manager
const manager = new ConfigManager('my-app')

// Update and persist configuration
await manager.updateConfig({
  format: 'json',
  rotation: {
    frequency: 'weekly',
  },
})
```

The configuration is stored in:

- Development: Local configuration files
- Production: System-appropriate locations based on platform

## Storage Utilities

### Path Resolution

```ts
import { getProjectRoot } from 'clarity/config'

// Get project root directory
const rootDir = getProjectRoot()

// Get path relative to project root
const logsPath = getProjectRoot('logs', { relative: true })
```

### Working with Log Files

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Get current log file path
const logPath = logger.getCurrentLogFilePath()

// Create a readable stream of the log file
const stream = logger.createReadStream()

// Read from stream
stream.on('data', (chunk) => {
  console.log(chunk.toString())
})
```

## Custom Storage Adapters

Clarity's architecture allows for implementing custom storage adapters for special use cases:

```ts
import { config, Logger } from 'clarity'
import { S3StorageAdapter } from './my-adapters'

// Example of extending with a custom storage adapter
const logger = new Logger('cloud-app', {
  // Core config
  ...config,

  // Custom storage
  storageAdapter: new S3StorageAdapter({
    bucket: 'my-logs-bucket',
    region: 'us-west-2',
  }),
})
```

*Note: Custom storage adapters require implementation of specific interfaces. See the API documentation for details.*
