# Logging

Clarity provides a comprehensive logging system with multiple levels, namespaces, and formatting options to help you effectively monitor and debug your applications.

## Log Levels

Clarity supports five log levels, each with a distinct purpose and visual styling:

| Level | Method | Description | Color |
|-------|--------|-------------|-------|
| debug | `logger.debug()` | Detailed information for debugging | Gray |
| info | `logger.info()` | General information about application operation | Blue |
| success | `logger.success()` | Successful operations and completed tasks | Green |
| warning | `logger.warn()` | Potential issues that don't prevent operation | Yellow |
| error | `logger.error()` | Errors and exceptions that impact functionality | Red |

Each level can be enabled or disabled independently through configuration, allowing you to control the verbosity of your logs.

## Basic Usage

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Log messages with different levels
await logger.debug('Debug information for developers')
await logger.info('General information about application state')
await logger.success('Operation completed successfully')
await logger.warn('Warning: approaching rate limit')
await logger.error('Failed to connect to database')

// Log with additional data
await logger.info('User activity', { userId: 123, action: 'login' })

// Log errors with stack traces
try {
  throw new Error('Database connection failed')
}
catch (error) {
  await logger.error(error) // Automatically captures stack trace
}
```

## Domain-Specific Logging

Create hierarchical loggers for different components of your application:

```ts
const logger = new Logger('api')

// Create sub-loggers for specific domains
const authLogger = logger.extend('auth')
const dbLogger = logger.extend('database')
const cacheLogger = logger.extend('cache')

await authLogger.info('User authenticated') // [api:auth] User authenticated
await dbLogger.error('Connection failed') // [api:database] Connection failed
await cacheLogger.debug('Cache miss') // [api:cache] Cache miss
```

## Conditional Logging

Optimize performance by only executing expensive operations when needed:

```ts
// Only execute logging code if the level is enabled
logger.only(() => {
  const expensiveOperation = calculateSomething()
  logger.debug('Operation result:', expensiveOperation)
})

// Enable/disable logging dynamically
logger.setEnabled(false) // Temporarily disable this logger
// ... some code ...
logger.setEnabled(true) // Re-enable logging
```

## Fancy Console Output

Clarity provides fancy console output options for improved readability:

```ts
const logger = new Logger('app', { fancy: true })

// Create boxed important messages
await logger.box('System initialized successfully')

// Interactive prompts
if (await logger.prompt('Delete all records?')) {
  // User confirmed
  await deleteRecords()
}

// Progress tracking
const progress = logger.progress(100, 'Processing files')
for (let i = 0; i < 100; i++) {
  progress.update(i, `Processing file ${i}`)
  // ... process file ...
}
progress.finish('All files processed')
```

## Asynchronous Logging

All Clarity logging methods return Promises, allowing for proper async/await handling:

```ts
async function processData() {
  await logger.info('Starting processing')

  try {
    const result = await heavyOperation()
    await logger.success('Processing completed', result)
    return result
  }
  catch (err) {
    await logger.error('Processing failed', err)
    throw err
  }
}
```

## Environment-Specific Behavior

Clarity automatically detects the current environment and adjusts its behavior:

```ts
// Server-side: writes to log files with ANSI colors in terminal
// Browser: outputs to console with browser styling
// Both: maintain consistent API and log format
```

For more advanced logging configurations and options, see the [Configuration](/advanced/configuration) page.
