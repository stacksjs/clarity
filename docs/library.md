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

### Log Rotation

Clarity provides flexible log rotation options to manage log files effectively:

```ts
import { Logger } from 'clarity'

// Basic rotation with defaults
const logger = new Logger('app', {
  rotation: {
    frequency: 'daily', // Rotate logs daily
    maxSize: 10485760, // 10MB max file size
    maxFiles: 5, // Keep 5 rotated files
    compress: false, // Don't compress old logs
  }
})

// Advanced rotation configuration
const advancedLogger = new Logger('app', {
  rotation: {
    // Time-based rotation
    frequency: 'daily', // Options: 'hourly', 'daily', 'weekly', 'monthly'
    rotateHour: 0, // Hour to rotate (0-23)
    rotateMinute: 0, // Minute to rotate (0-59)
    rotateDayOfWeek: 0, // Day of week to rotate (0-6, 0 is Sunday)
    rotateDayOfMonth: 1, // Day of month to rotate (1-31)

    // Size-based rotation
    maxSize: 10 * 1024 * 1024, // Rotate when file reaches 10MB
    maxFiles: 5, // Keep 5 rotated files

    // File handling
    compress: true, // Compress rotated logs
    encrypt: { // Encrypt rotated logs
      algorithm: 'aes-256-gcm',
      compress: true,
    }
  }
})
```

#### Rotation Configuration

1. **Time-Based Rotation**

   ```ts
   const logger = new Logger('app', {
     rotation: {
       // Rotate daily at midnight
       frequency: 'daily',
       rotateHour: 0,
       rotateMinute: 0,

       // Or weekly on Sunday
       frequency: 'weekly',
       rotateDayOfWeek: 0,

       // Or monthly on the 1st
       frequency: 'monthly',
       rotateDayOfMonth: 1,
     }
   })
   ```

2. **Size-Based Rotation**

   ```ts
   const logger = new Logger('app', {
     rotation: {
       maxSize: 50 * 1024 * 1024, // 50MB
       maxFiles: 10, // Keep 10 files
     }
   })
   ```

3. **Combined Rotation**

   ```ts
   const logger = new Logger('app', {
     rotation: {
       frequency: 'daily',
       maxSize: 10 * 1024 * 1024, // Also rotate if file reaches 10MB
       maxFiles: 5,
       compress: true, // Compress old logs
     }
   })
   ```

#### File Management

```ts
// Configure log directory and naming
const logger = new Logger('app', {
  logDirectory: './logs', // Where to store logs
  logDatePattern: 'YYYY-MM-DD', // Date pattern in filenames
  maxLogSize: 10 * 1024 * 1024, // Maximum size per log file
})
```

#### Best Practices

1. **Storage Management**
   - Set appropriate `maxFiles` to prevent disk space issues
   - Enable compression for long-term storage
   - Use time-based rotation for compliance requirements

2. **Performance**
   - Balance `maxSize` with write frequency
   - Consider filesystem performance
   - Monitor rotation overhead

3. **Maintenance**
   - Regular cleanup of old log files
   - Verify rotation timing
   - Monitor disk space usage

### Encryption

Clarity supports encryption of log files for sensitive data protection:

```ts
import { Logger } from 'clarity'

// Create a logger with encryption enabled
const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      algorithm: 'aes-256-gcm', // Supported: 'aes-256-cbc', 'aes-256-gcm'
      compress: true, // Optional compression before encryption
    }
  }
})

// Logs are automatically encrypted
await logger.info('Sensitive data', {
  creditCard: '4111-1111-1111-1111',
  ssn: '123-45-6789'
})

// Reading encrypted logs
const entries = await logger.readLog('path/to/logfile')
// Entries are automatically decrypted
```

#### Key Management

Clarity supports automatic key rotation and management:

```ts
import { Buffer } from 'node:buffer'

const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      algorithm: 'aes-256-gcm',
    },
    keyRotation: {
      enabled: true,
      maxKeys: 3, // Keep last 3 keys for decrypting old logs
    }
  }
})

// Manually manage keys if needed
const { key, id } = logger.getCurrentKey()
logger.setEncryptionKey('custom-key-id', Buffer.from('your-key'))
```

#### Re-encryption

You can re-encrypt logs with new keys or algorithms:

```ts
await logger.reEncryptLogFile(
  'old-logs.txt',
  'new-logs.txt',
  {
    algorithm: 'aes-256-gcm',
    compress: true
  }
)

// Validate encryption
const validation = await logger.validateEncryption('logs.txt')
if (!validation.isValid) {
  console.error('Encryption issues:', validation.errors)
}
```

#### Best Practices

1. **Key Security**
   - Use environment variables for encryption keys
   - Rotate keys regularly
   - Back up keys securely

2. **Algorithm Selection**
   - Use `aes-256-gcm` for best security (authenticated encryption)
   - Enable compression for large logs
   - Consider performance impact on high-volume logging

3. **Validation**
   - Regularly validate encrypted logs
   - Keep backup copies before re-encryption
   - Monitor decryption errors

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

### Progress Bar

Clarity can display a dynamic progress bar directly in the console for long-running tasks, provided `fancy` mode is enabled and the code is running in a Node.js environment with a TTY.

```ts
const logger = new Logger('task-runner', { fancy: true })

async function runTask() {
  const totalSteps = 50
  // Initialize the progress bar
  const progressBar = logger.progress(totalSteps, 'Starting task...')

  for (let i = 0; i <= totalSteps; i++) {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 80))

    // Update the progress bar display
    progressBar.update(i, `Processing step ${i}...`)

    // Example: Log an interruption without breaking the flow
    if (i === 25) {
      progressBar.interrupt('Checkpoint reached, pausing briefly.', 'info')
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate pause
    }
  }

  // Mark the progress bar as complete
  progressBar.finish('Task completed successfully!')
}

runTask()
```

**Method:** `logger.progress(total: number, initialMessage?: string)`

- `total`: The maximum value representing 100% completion.
- `initialMessage` (optional): A message to display alongside the progress bar initially.

**Returns:** An object with the following methods:

- `update(current: number, message?: string)`: Updates the progress bar to reflect the `current` value (out of `total`). Optionally updates the displayed message.
- `finish(message?: string)`: Sets the progress bar to 100%, optionally displays a final message, and moves the cursor to the next line.
- `interrupt(message: string, level?: LogLevel = 'info')`: Temporarily clears the progress bar line, logs the provided `message` using the specified `level` (or 'info' by default), and then redraws the progress bar at its previous state. This is useful for logging warnings or intermediate info without permanently disrupting the bar.

**Note:** If `fancy` mode is disabled, or if running in a non-TTY environment (like a browser or CI pipeline), calling `logger.progress` will return methods that perform no action. Standard log calls (`logger.info`, `logger.warn`, etc.) made while a progress bar is active might interfere with its display; use the `interrupt` method for logging during progress updates.

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
