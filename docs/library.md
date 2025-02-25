# Library Guide

This guide covers everything you need to know about using Clarity as a library in your TypeScript applications.

## Quick Start

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')
await logger.info('Hello, Clarity!')
```

## Core Concepts

### Logger Instance

The `Logger` class is the main entry point:

```ts
import { Logger } from 'clarity'

// Basic logger
const logger = new Logger('app')

// With configuration
const configuredLogger = new Logger('app', {
  level: 'debug',
  format: 'json',
  timestamp: true,
})

// Domain-specific logger
const apiLogger = new Logger('api')
const authLogger = apiLogger.extend('auth')
```

### Log Levels

Clarity supports five log levels, each with its own color and purpose:

```ts
// Debug - Gray (Detailed information for debugging)
logger.debug('SQL Query:', { sql: 'SELECT * FROM users', params: [1, 2] })

// Info - Blue (General information about application flow)
logger.info('Processing request:', req.path)

// Success - Green (Successful operations)
logger.success('User registration completed')

// Warning - Yellow (Non-error issues that need attention)
logger.warn('API rate limit at 80%')

// Error - Red (Error conditions and failures)
logger.error('Database connection failed:', error)
```

### Async Logging

All logging methods return promises and can be awaited:

```ts
async function processUser(user: User) {
  await logger.info('Starting user processing')

  try {
    await someAsyncOperation()
    await logger.success('User processed successfully')
  }
  catch (error) {
    await logger.error('Processing failed:', error)
    throw error
  }
}
```

## Advanced Features

### Performance Tracking

Track operation timing with built-in performance monitoring:

```ts
// Simple timing
const end = logger.time('Database query')
const users = await db.users.find()
await end() // Outputs: "Database query completed in 123ms"

// Multiple concurrent operations
const [authEnd, dbEnd] = [
  logger.time('Authentication'),
  logger.time('Database'),
]

await Promise.all([
  authenticate().then(() => authEnd()),
  queryDb().then(() => dbEnd()),
])

// With operation context
logger.time('API Request', async () => {
  const response = await fetch('/api/users')
  return response.json()
})
```

### Structured Logging

Log structured data for better analysis:

```ts
// Basic structured data
await logger.info('User action', {
  userId: 123,
  action: 'login',
  timestamp: new Date(),
})

// With type safety
interface AuditLog {
  userId: number
  action: string
  resource: string
  changes: Record<string, any>
}

await logger.info<AuditLog>('Resource updated', {
  userId: 123,
  action: 'update',
  resource: 'users',
  changes: {
    name: 'New Name',
    role: 'admin',
  },
})
```

### Domain-Specific Logging

Organize logs by domain for better clarity:

```ts
// Create domain hierarchy
const logger = new Logger('app')
const api = logger.extend('api')
const auth = api.extend('auth')
const db = api.extend('db')

// Usage in different modules
await auth.info('User authenticated') // [app:api:auth] User authenticated
await db.warn('Slow query detected') // [app:api:db] Slow query detected

// With metadata
await auth.info('Login attempt', {
  username: 'john',
  ip: '192.168.1.1',
  success: true,
})
```

### Conditional Logging

Control when logging code executes:

```ts
// Only execute if logging is enabled
logger.only(() => {
  const metrics = calculateExpensiveMetrics()
  logger.debug('System metrics:', metrics)
})

// Level-specific conditions
if (logger.shouldLog('debug')) {
  const details = gatherDebugInfo()
  await logger.debug('Debug info:', details)
}

// Environment-based logging
const devLogger = new Logger('dev', {
  enabled: process.env.NODE_ENV !== 'production',
})
```

### Error Handling

Best practices for error logging:

```ts
try {
  await riskyOperation()
}
catch (error) {
  // Basic error logging
  await logger.error('Operation failed:', error)

  // Structured error logging
  await logger.error('Operation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context: {
      operation: 'riskyOperation',
      inputs: { /* operation parameters */ },
    },
  })
}
```

## TypeScript Integration

### Type-Safe Logging

Leverage TypeScript for safer logging:

```ts
// Define log message types
interface UserLog {
  userId: number
  action: 'login' | 'logout' | 'register'
  metadata: {
    ip: string
    userAgent: string
  }
}

// Type-safe logging methods
await logger.info<UserLog>('User action', {
  userId: 123,
  action: 'login',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
  },
})

// Custom log level types
type CustomLevel = 'debug' | 'info' | 'error'
const typedLogger = new Logger<CustomLevel>('app')
```

### Framework Integration

#### Express Middleware

```ts
import type { NextFunction, Request, Response } from 'express'

const requestLogger = new Logger('express')

app.use((req: Request, res: Response, next: NextFunction) => {
  const end = requestLogger.time(`${req.method} ${req.path}`)

  res.on('finish', () => {
    end({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: 'auto',
    })
  })

  next()
})
```

#### Vue Component

```ts
import type { Component } from 'vue'
import { Logger } from 'clarity'

export const MyComponent: Component = {
  setup() {
    const logger = new Logger('vue:MyComponent')

    onMounted(async () => {
      await logger.debug('Component mounted')
    })

    return {
      async handleClick() {
        await logger.info('Button clicked')
      },
    }
  },
}
```

## Best Practices

### 1. Consistent Naming

```ts
// Use hierarchical naming
const logger = new Logger('app')
const apiLogger = logger.extend('api')
const authLogger = apiLogger.extend('auth')

// Use descriptive names
const paymentLogger = new Logger('payment:stripe')
const emailLogger = new Logger('notifications:email')
```

### 2. Structured Data

```ts
// Instead of string concatenation
// ❌ Bad
await logger.info(`User ${userId} performed ${action}`)

// ✅ Good
await logger.info('User action', { userId, action })
```

### 3. Error Context

```ts
// ❌ Bad
await logger.error(error.message)

// ✅ Good
await logger.error('Operation failed', {
  error: {
    message: error.message,
    stack: error.stack,
    code: error.code,
  },
  context: {
    operation: 'name',
    input: { /* sanitized input */ },
  },
})
```

### 4. Performance Considerations

```ts
// Use conditional logging for expensive operations
logger.only(() => {
  const metrics = calculateExpensiveMetrics()
  logger.debug('Metrics:', metrics)
})

// Buffer logs in high-throughput scenarios
const logger = new Logger('high-traffic', {
  bufferSize: 100,
  flushInterval: '1s',
})
```

## Next Steps

- Explore [Configuration Options](./config) for customization
- Learn about [CLI Tools](./cli) for log management
- Check out [Examples](./examples) for more use cases
