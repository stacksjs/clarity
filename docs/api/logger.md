# Logger API Reference

The `Logger` class is the core of Clarity, providing methods for logging, performance tracking, and log management.

## Creating a Logger

```ts
import { Logger } from 'clarity'

// Create a logger with a namespace
const logger = new Logger('app')

// Create a logger with options
const configuredLogger = new Logger('api', {
  level: 'debug',
  format: 'json',
  logDirectory: './logs',
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024,
    compress: true,
  },
  fingersCrossedEnabled: true,
  fingersCrossed: {
    activationLevel: 'error',
    bufferSize: 50,
  },
  fancy: true,
  showTags: true,
})
```

## Constructor Options

The Logger constructor accepts options that control its behavior:

```ts
interface ExtendedLoggerOptions {
  // Log configuration
  level?: LogLevel
  format?: 'json' | 'text'
  logDirectory?: string
  rotation?: RotationConfig

  // Custom formatting
  formatter?: Formatter
  fancy?: boolean
  showTags?: boolean
  tagFormat?: { prefix?: string, suffix?: string }
  timestampPosition?: 'left' | 'right'

  // Fingers-crossed buffering
  fingersCrossedEnabled?: boolean
  fingersCrossed?: {
    activationLevel?: LogLevel
    bufferSize?: number
    flushOnDeactivation?: boolean
    stopBuffering?: boolean
  }

  // Other settings
  enabled?: boolean
}
```

## Logging Methods

### Basic Logging

```ts
// Log at different levels
await logger.debug(message: string, ...args: any[]): Promise<void>
await logger.info(message: string, ...args: any[]): Promise<void>
await logger.success(message: string, ...args: any[]): Promise<void>
await logger.warn(message: string, ...args: any[]): Promise<void>
await logger.error(message: string | Error, ...args: any[]): Promise<void>
```

All logging methods:

- Return Promises for proper async/await handling
- Support format string placeholders (%s, %d, %j, %o)
- Accept additional arguments that will be serialized

### Performance Tracking

```ts
// Start timing an operation
const end = logger.time(label: string): (metadata?: Record<string, any>) => Promise<void>

// End timing and log the result
await end() // Shows elapsed time
await end({ /* additional metadata */ }) // Shows time with metadata

// Simpler start/end pattern
await logger.start(message: string, ...args: any[]): Promise<void>
// ... then end with any log level
await logger.success(message: string): Promise<void> // Shows elapsed time
```

### Progress Tracking

```ts
// Create a progress tracker
const progress = logger.progress(
  total: number,
  initialMessage: string = ''
): {
  update: (current: number, message?: string) => void
  finish: (message?: string) => void
  interrupt: (message: string, level?: LogLevel) => void
}

// Update progress
progress.update(45, 'Processing file 45/100')

// Complete progress
progress.finish('All files processed')

// Show a message without disrupting the progress bar
progress.interrupt('Found duplicate files', 'warning')
```

### Fancy Output

```ts
// Create boxed message
await logger.box(message: string): Promise<void>

// Interactive prompt
const confirmed = await logger.prompt(message: string): Promise<boolean>

// Enable/disable fancy output
logger.setFancy(enabled: boolean): void
logger.isFancy(): boolean
```

## Log Management

### Creating Sub-Loggers

```ts
// Create a namespaced sub-logger
const subLogger = logger.extend(namespace: string): Logger

// Examples
const dbLogger = logger.extend('database')
const authLogger = dbLogger.extend('auth') // Results in 'app:database:auth'
```

### Controlling Log State

```ts
// Enable/disable logging
logger.setEnabled(enabled: boolean): void
logger.isEnabled(): boolean

// Pause/resume logging (temporary state)
logger.pause(): void
logger.resume(): void

// Conditional execution - only runs if logging is enabled
await logger.only<T>(fn: () => T | Promise<T>): Promise<T | undefined>
```

### Log File Operations

```ts
// Get current log file path
logger.getCurrentLogFilePath(): string

// Create a readable stream of the current log file
const stream = logger.createReadStream(): NodeJS.ReadableStream

// Decrypt encrypted log data
const plaintext = await logger.decrypt(data: string | Buffer): Promise<string>

// Clean up resources
await logger.destroy(): Promise<void>

// Flush pending writes to ensure all logs are written
await logger.flushPendingWrites(): Promise<void>
```

### Configuration Access

```ts
// Get current log level
logger.getLevel(): LogLevel

// Get log directory path
logger.getLogDirectory(): string

// Get current format
logger.getFormat(): string | undefined

// Get rotation configuration
logger.getRotationConfig(): RotationConfig | boolean | undefined

// Check environment
logger.isBrowserMode(): boolean
logger.isServerMode(): boolean

// Get full configuration
logger.getConfig(): ClarityConfig
```

## Advanced Features

### Encryption

```ts
// Check if encryption is properly configured
logger.validateEncryptionConfig(): boolean

// Get encryption options
logger.getEncryptionOptions(): EncryptionConfig

// Testing utilities (for unit tests)
logger.setTestEncryptionKey(keyId: string, key: Buffer): void
logger.getTestCurrentKey(): { id: string, key: Buffer } | null
```

### Log Rotation

```ts
// Generate log filename based on date pattern
logger.generateLogFilename(): string

// Set up automatic rotation
logger.setupRotation(): void

// Manually rotate log file
await logger.rotateLog(): Promise<void>
```

The Logger class provides a comprehensive API for all logging needs, from simple message logging to advanced performance tracking and log management.
