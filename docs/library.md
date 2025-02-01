# Library Guide

This guide covers everything you need to know about using clarity as a library in your TypeScript/Bun applications.

## Basic Usage

### Creating a Logger

```ts
import { Logger } from 'clarity'

// Create a new logger instance
const logger = new Logger('app')

// Basic logging
logger.info('Application starting...')
logger.success('Server started successfully')
logger.warning('Resource usage high')
logger.error('Failed to connect to database')
```

### Log Levels

clarity supports multiple log levels for different use cases:

```ts
// Debug - for detailed information
logger.debug('SQL Query:', query)

// Info - for general information
logger.info('Processing request...')

// Success - for successful operations
logger.success('Email sent successfully')

// Warning - for concerning but non-error situations
logger.warning('Cache miss, falling back to database')

// Error - for error conditions
logger.error('Failed to process payment')
```

## Advanced Features

### Performance Tracking

Track operation duration automatically:

```ts
const logger = new Logger('performance')

// Start tracking
const end = logger.info('Starting database migration...')

// Perform work
await runMigrations()

// End tracking - automatically includes duration
end('Migration completed') // Output: Migration completed 1234.56ms
```

### Domain-specific Logging

Create specialized loggers for different parts of your application:

```ts
const logger = new Logger('api')

// Create domain-specific loggers
const authLogger = logger.extend('auth')
const dbLogger = logger.extend('db')
const cacheLogger = logger.extend('cache')

// Usage
authLogger.info('User authenticated') // Output: [api:auth] User authenticated
dbLogger.warning('Slow query detected') // Output: [api:db] Slow query detected
cacheLogger.error('Cache failure') // Output: [api:cache] Cache failure
```

### Conditional Logging

Execute logging code only when enabled:

```ts
const logger = new Logger('dev')

logger.only(() => {
  // This code only runs when logging is enabled
  logger.debug('Current state:', {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  })
})
```

### Format Strings

Use format strings for clean log messages:

```ts
logger.info('Found %d errors in %s', 3, 'user-service.ts')
logger.debug('Query took %dms to execute', 123.45)
logger.warning('Rate limit: %d/%d requests', 95, 100)
```

### Object & Error Logging

clarity handles different types of data intelligently:

```ts
// Object logging
logger.info({
  user: 'john',
  action: 'login',
  timestamp: new Date()
})

// Error logging
try {
  throw new Error('Connection failed')
}
catch (error) {
  logger.error('Database error:', error)
}

// Array logging
logger.debug('Active users:', ['john', 'jane', 'bob'])
```

## Browser Support

clarity works seamlessly in both Node.js/Bun and browser environments:

```ts
// Browser usage
const logger = new Logger('frontend')

logger.info('Page loaded')
logger.debug('Current route:', window.location.pathname)

// Automatically detects environment and adjusts output
```

## Configuration

### Environment Variables

Control logging behavior with environment variables:

```bash
# Enable all logging
DEBUG=true

# Enable specific logger
DEBUG=api:auth

# Enable logger and all sub-loggers
DEBUG=api:*

# Set log level
LOG_LEVEL=debug    # Show all logs
LOG_LEVEL=error    # Show only errors
```

### Runtime Configuration

Configure logger behavior programmatically:

```ts
import { config } from 'clarity'

// Global configuration
config.verbose = true

// Logger-specific configuration
const logger = new Logger('app', {
  level: 'debug',
  timestamp: true,
  colors: true
})
```

## Best Practices

### Organizing Loggers

Structure your loggers to match your application architecture:

```ts
// services/auth.ts
// api/users.ts
import { authLogger } from '../services/auth'

export const authLogger = new Logger('services:auth')

// services/db.ts
export const dbLogger = new Logger('services:db')
const usersLogger = authLogger.extend('users')
```

### Error Handling

Proper error logging patterns:

```ts
async function fetchUser(id: string) {
  const logger = new Logger('api:users')

  try {
    logger.debug('Fetching user:', id)
    const user = await db.users.findById(id)

    if (!user) {
      logger.warning('User not found:', id)
      return null
    }

    logger.success('User fetched successfully')
    return user
  }
  catch (error) {
    logger.error('Failed to fetch user:', error)
    throw error
  }
}
```

### Performance Monitoring

Track performance across your application:

```ts
async function processQueue() {
  const logger = new Logger('queue')
  const end = logger.info('Processing queue items...')

  let processed = 0
  for (const item of queue) {
    const itemEnd = logger.debug('Processing item:', item.id)
    await processItem(item)
    itemEnd('Item processed')
    processed++
  }

  end('Queue processing completed. Processed %d items', processed)
}
```

## TypeScript Support

clarity is written in TypeScript and provides full type safety:

```ts
import type { Logger, LogLevel, LogOptions } from 'clarity'

// Type-safe log levels
function logAtLevel(level: LogLevel, message: string) {
  const logger = new Logger('typed')
  logger[level](message)
}

// Type-safe options
const options: LogOptions = {
  level: 'debug',
  timestamp: true
}

const logger = new Logger('app', options)
```

## Integration Examples

### Express Middleware

```ts
import { Logger } from 'clarity'
import express from 'express'

const logger = new Logger('express')

app.use((req, res, next) => {
  const reqLogger = logger.extend(req.path)
  const end = reqLogger.info('%s %s', req.method, req.path)

  res.on('finish', () => {
    end('Response sent: %d', res.statusCode)
  })

  next()
})
```

### Vue Component

```ts
import type { Component } from 'vue'
import { Logger } from 'clarity'

export const MyComponent: Component = {
  name: 'MyComponent',
  setup() {
    const logger = new Logger('vue:MyComponent')

    logger.debug('Component created')

    onMounted(() => {
      logger.info('Component mounted')
    })

    onUnmounted(() => {
      logger.info('Component unmounted')
    })
  }
}
```

### React Hook

```ts
import { Logger } from 'clarity'
import { useEffect } from 'react'

function useLogger(name: string) {
  const logger = new Logger(`react:${name}`)

  useEffect(() => {
    logger.debug('Component mounted')
    return () => logger.debug('Component unmounted')
  }, [])

  return logger
}

function MyComponent() {
  const logger = useLogger('MyComponent')

  // Use logger in your component...
}
```
