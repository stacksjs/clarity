# Logger

The Logger class is the core component of Clarity, providing robust logging functionality with support for multiple output formats, log levels, file rotation, encryption, and more.

## Basic Usage

```ts
import { Logger } from 'clarity'

// Create a logger with a name
const logger = new Logger('app')

// Log methods for different levels
await logger.debug('Debugging information')
await logger.info('Application started')
await logger.success('Operation completed successfully')
await logger.warn('Warning: disk space low')
await logger.error('Failed to connect to database')

// Log with formatted messages
await logger.info('User %s logged in from %s', 'alice', '192.168.1.1')
await logger.info('Processing %d items', 100)

// Log with object data
await logger.info('Request completed', {
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  duration: 25
})

// Log errors with stack traces
try {
  throw new Error('Connection refused')
} catch (err) {
  await logger.error(err)
}
```

## Constructor

```ts
constructor(name: string, options: Partial<ExtendedLoggerOptions> = {})
```

Creates a new logger instance.

**Parameters:**

- `name`: A unique name for the logger, used for namespacing logs
- `options`: Configuration options for the logger

**Options:**

- `level`: The minimum log level to record (`'debug'`, `'info'`, `'success'`, `'warning'`, `'error'`)
- `format`: Output format (`'json'` or `'text'`)
- `logDirectory`: Directory to store log files
- `rotation`: Log rotation configuration
- `timestamp`: Timestamp format or boolean to enable/disable
- `formatter`: Custom formatter implementation
- `fingersCrossedEnabled`: Enable "fingers-crossed" logging mode
- `fingersCrossed`: Configuration for fingers-crossed mode
- `enabled`: Whether logging is enabled
- `fancy`: Enable fancy terminal output with colors and formatting
- `showTags`: Show logger name tags in console output
- `tagFormat`: Custom format for tags
- `timestampPosition`: Control timestamp position (`'left'` or `'right'`)

## Log Methods

### debug, info, success, warn, error

```ts
async debug(message: string, ...args: any[]): Promise<void>
async info(message: string, ...args: any[]): Promise<void>
async success(message: string, ...args: any[]): Promise<void>
async warn(message: string, ...args: any[]): Promise<void>
async error(message: string | Error, ...args: any[]): Promise<void>
```

Log a message at the specified level.

**Parameters:**

- `message`: The message to log (string or Error object for error method)
- `args`: Additional arguments for formatting or to be included in the log

## Special Logging Methods

### time

```ts
time(label: string): (metadata?: Record<string, any>) => Promise<void>
```

Starts timing an operation and returns a function to stop timing.

```ts
const stopTimer = logger.time('database-query')
// Do some work...
await stopTimer({ records: 150 }) // Logs completion with elapsed time
```

### box

```ts
async box(message: string): Promise<void>
```

Creates a boxed message in the console for important information.

```ts
await logger.box('Application started in development mode')
```

### prompt

```ts
async prompt(message: string): Promise<boolean>
```

Displays a confirmation prompt and returns the user's response.

```ts
if (await logger.prompt('Delete all logs?')) {
  // User confirmed
}
```

### progress

```ts
progress(total: number, initialMessage: string = ''): {
  update: (current: number, message?: string) => void
  finish: (message?: string) => void
  interrupt: (message: string, level?: LogLevel) => void
}
```

Creates and manages a progress bar in the console.

```ts
const progress = logger.progress(100, 'Processing files')
for (let i = 0; i < 100; i++) {
  // Do work...
  progress.update(i + 1, `Processing file ${i + 1}/100`)
}
progress.finish('All files processed')
```

### start

```ts
async start(message: string, ...args: any[]): Promise<void>
```

Logs a starting task with a spinner-like indicator.

```ts
await logger.start('Initializing server')
```

## Control Methods

### destroy

```ts
async destroy(): Promise<void>
```

Cleans up resources and flushes pending writes.

```ts
await logger.destroy()
```

### flushPendingWrites

```ts
async flushPendingWrites(): Promise<void>
```

Ensures all pending log writes are committed to disk.

### extend

```ts
extend(namespace: string): Logger
```

Creates a child logger with a sub-namespace.

```ts
const logger = new Logger('app')
const dbLogger = logger.extend('database')
await dbLogger.info('Connected') // Logs as 'app:database'
```

### setEnabled / isEnabled

```ts
setEnabled(enabled: boolean): void
isEnabled(): boolean
```

Controls whether logging is enabled.

```ts
logger.setEnabled(false) // Disable logging
if (logger.isEnabled()) {
  // Logging is enabled
}
```

### pause / resume

```ts
pause(): void
resume(): void
```

Temporarily pauses or resumes logging.

### setFancy / isFancy

```ts
setFancy(enabled: boolean): void
isFancy(): boolean
```

Controls fancy terminal output.

### only

```ts
async only<T>(fn: () => T | Promise<T>): Promise<T | undefined>
```

Executes a function only if logging is enabled.

```ts
const result = await logger.only(async () => {
  // Expensive logging-related operation
  return calculateStats()
})
```

## File Operations

### createReadStream

```ts
createReadStream(): NodeJS.ReadableStream
```

Creates a readable stream of the current log file.

### getCurrentLogFilePath

```ts
getCurrentLogFilePath(): string
```

Gets the path to the current log file.

### decrypt

```ts
async decrypt(data: string | Buffer): Promise<string>
```

Decrypts encrypted log data.

## Configuration Access

### getLevel

```ts
getLevel(): LogLevel
```

Gets the current log level.

### getLogDirectory

```ts
getLogDirectory(): string
```

Gets the current log directory.

### getFormat

```ts
getFormat(): string | undefined
```

Gets the current format.

### getRotationConfig

```ts
getRotationConfig(): RotationConfig | boolean | undefined
```

Gets the current rotation configuration.

### getConfig

```ts
getConfig(): ClarityConfig
```

Gets the complete configuration.

## Environment Detection

### isBrowserMode

```ts
isBrowserMode(): boolean
```

Checks if the logger is running in browser mode.

### isServerMode

```ts
isServerMode(): boolean
```

Checks if the logger is running in server mode.

## Default Logger

Clarity provides a pre-configured logger instance:

```ts
import { logger } from 'clarity'

// Use the default logger
await logger.info('Application started')
```

The default logger uses the name 'stacks' and applies the global configuration.

## Advanced Examples

### Custom Formatting

```ts
import { Logger, JsonFormatter } from 'clarity'

const logger = new Logger('api', {
  formatter: new JsonFormatter(),
  fancy: true,
  showTags: true,
  tagFormat: { prefix: '«', suffix: '»' }
})
```

### Fingers-Crossed Mode

```ts
import { Logger } from 'clarity'

// Only write to log file when errors occur
const logger = new Logger('app', {
  fingersCrossedEnabled: true,
  fingersCrossed: {
    activationLevel: 'error',
    bufferSize: 100,
    flushOnDeactivation: true
  }
})
```

### Log Rotation with Encryption

```ts
import { Logger } from 'clarity'

const logger = new Logger('secure-app', {
  rotation: {
    frequency: 'daily',
    maxSize: 5 * 1024 * 1024,
    compress: true,
    encrypt: {
      algorithm: 'aes-256-gcm',
      compress: true,
      keyRotation: {
        enabled: true,
        interval: 30,
        maxKeys: 3
      }
    }
  }
})
```
