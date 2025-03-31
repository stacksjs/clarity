# Usage

Clarity offers two powerful ways to manage your logs: as a library in your code or through the CLI. This guide covers both approaches with practical examples.

## Library Usage

### Basic Setup

```ts
import { Logger } from 'clarity'

// Create a logger instance
const logger = new Logger('app')

// Basic logging
await logger.info('Application starting...')
await logger.success('Server started on port 3000')
await logger.warn('High memory usage detected')
await logger.error('Failed to connect to database')

// With metadata
await logger.info('Request received', {
  method: 'GET',
  path: '/api/users',
  ip: '192.168.1.1',
})
```

### Common Patterns

#### 1. Domain-Specific Logging

Organize logs by feature or module:

```ts
// Create specialized loggers
const api = new Logger('api')
const auth = api.extend('auth')
const db = api.extend('database')
const cache = api.extend('cache')

// Usage in different modules
await auth.info('User authenticated') // [api:auth] User authenticated
await db.warn('Slow query detected') // [api:database] Slow query detected
await cache.error('Cache miss') // [api:cache] Cache miss

// With context
await auth.info('Login attempt', {
  username: 'john.doe',
  ip: '192.168.1.1',
  success: true,
})
```

#### 2. Performance Tracking

Monitor operation timing:

```ts
// Simple timing
const end = logger.time('Database query')
const users = await db.users.find()
await end() // Shows duration automatically

// Multiple operations
const [authEnd, dbEnd] = [
  logger.time('Auth check'),
  logger.time('DB query'),
]

await Promise.all([
  checkAuth().then(() => authEnd()),
  queryDb().then(() => dbEnd()),
])

// With automatic cleanup
await logger.time('API Request', async () => {
  const response = await fetch('/api/data')
  return response.json()
})
```

#### 3. Error Handling

Proper error logging patterns:

```ts
try {
  await riskyOperation()
}
catch (error) {
  // Structured error logging
  await logger.error('Operation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context: {
      operation: 'riskyOperation',
      params: { /* sanitized parameters */ },
    },
  })
}
```

#### 4. Conditional Logging

Control when logging happens:

```ts
// Only execute if logging is enabled
logger.only(() => {
  const metrics = gatherMetrics() // expensive operation
  logger.debug('System metrics:', metrics)
})

// Level-specific logging
if (logger.shouldLog('debug')) {
  const details = gatherDebugInfo()
  await logger.debug('Debug info:', details)
}

// Development-only logging
const devLogger = new Logger('dev', {
  enabled: process.env.NODE_ENV !== 'production',
})
```

## CLI Usage

### Real-time Monitoring

Watch logs as they happen:

```bash
# Watch all logs
clarity watch

# Watch specific log levels
clarity watch --level error
clarity watch --level "warn,error"

# Watch specific domains
clarity watch --name "api:*"
clarity watch --name "api:auth,api:db"

# With formatting
clarity watch --json --timestamp
```

### Log Management

Search and analyze logs:

```bash
# Search logs
clarity search "error" --level error
clarity search "failed login" --name "api:auth"

# Export logs
clarity export --format json --output logs.json
clarity export --start 2024-01-01 --end 2024-01-31

# View recent logs
clarity tail --lines 50 --follow
clarity tail --level error --name "api:*"
```

### One-off Logging

Send logs from scripts or CI/CD:

```bash
# Simple logging
clarity log "Deployment started"

# With metadata
clarity log "Build completed" --level success --meta '{"version":"1.2.3"}'

# Domain-specific
clarity log "Cache cleared" --name "system:cache"
```

## Common Use Cases

### 1. API Server Logging

```ts
import { Logger } from 'clarity'
import express from 'express'

const app = express()
const logger = new Logger('api')

// Request logging middleware
app.use(async (req, res, next) => {
  const end = logger.time(`${req.method} ${req.path}`)

  res.on('finish', () => {
    end({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ip: req.ip,
    })
  })

  next()
})

// Route handlers
app.post('/users', async (req, res) => {
  const userLogger = logger.extend('users')

  try {
    await userLogger.info('Creating user', { data: req.body })
    const user = await createUser(req.body)
    await userLogger.success('User created', { userId: user.id })
    res.json(user)
  }
  catch (error) {
    await userLogger.error('User creation failed', { error })
    res.status(500).json({ error: 'Failed to create user' })
  }
})
```

### 2. Background Job Logging

```ts
const jobLogger = new Logger('jobs')

async function processQueue() {
  const logger = jobLogger.extend('queue')
  const end = logger.time('Processing queue')

  try {
    const items = await queue.fetch()
    await logger.info('Starting batch', { count: items.length })

    for (const item of items) {
      const itemEnd = logger.time(`Item ${item.id}`)
      try {
        await processItem(item)
        await itemEnd({ status: 'success' })
      }
      catch (error) {
        await itemEnd({ status: 'error', error: error.message })
      }
    }

    await end({ processed: items.length })
  }
  catch (error) {
    await logger.error('Queue processing failed', { error })
    await end({ status: 'error' })
  }
}
```

### 3. Development Debugging

```ts
const debugLogger = new Logger('debug', {
  level: 'debug',
  enabled: process.env.NODE_ENV !== 'production',
})

// Component debugging
function MyComponent() {
  const logger = debugLogger.extend('MyComponent')

  logger.only(() => {
    logger.debug('Props:', props)
    logger.debug('State:', state)
  })

  // ... component logic
}

// API debugging
async function fetchData() {
  const logger = debugLogger.extend('api')

  try {
    const end = logger.time('API call')
    const response = await fetch('/api/data')
    const data = await response.json()

    await end({
      status: response.status,
      size: JSON.stringify(data).length,
    })

    return data
  }
  catch (error) {
    await logger.error('API call failed', { error })
    throw error
  }
}
```

## Secure Logging

### Encryption Setup

Enable encryption to protect sensitive log data:

```ts
import { Logger } from 'clarity'

const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      algorithm: 'aes-256-gcm', // Most secure option
      compress: true, // Optional compression
    }
  }
})
```

### Environment Configuration

Set up encryption keys securely:

```bash
# In your .env file or environment
LOG_ENCRYPTION_KEY="your-secure-key"
```

```ts
// In your application
const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      algorithm: 'aes-256-gcm',
    },
    keyRotation: {
      enabled: true,
      maxKeys: 3,
    }
  }
})
```

### Working with Encrypted Logs

Reading encrypted logs is transparent:

```ts
// Logs are automatically encrypted when written
await logger.info('Sensitive user data', {
  userId: 123,
  ssn: '123-45-6789'
})

// Logs are automatically decrypted when read
const entries = await logger.readLog('app.log')
for (const entry of entries) {
  console.log(entry.message)
}

// Stream encrypted logs
const stream = logger.createReadStream()
for await (const chunk of stream) {
  // Chunks are automatically decrypted
  console.log(chunk.toString())
}
```

### Maintenance Tasks

```ts
// Re-encrypt logs with new settings
await logger.reEncryptLogFile(
  'old-logs.txt',
  'new-logs.txt',
  {
    algorithm: 'aes-256-gcm',
    compress: true
  }
)

// Validate encryption
const validation = await logger.validateEncryption('app.log')
if (!validation.isValid) {
  console.error('Found encryption issues:', validation.errors)
}
```

### Security Considerations

1. **Key Management**
   - Store encryption keys securely
   - Use different keys for different environments
   - Implement key rotation policies
   - Back up encryption keys safely

2. **Performance Impact**
   - Encryption adds processing overhead
   - Use compression for large log volumes
   - Monitor logging latency
   - Consider log rotation settings

3. **Compliance**
   - Verify encryption meets compliance requirements
   - Document encryption configurations
   - Maintain key access audit trails
   - Regular security reviews

## Configuration

### Basic Configuration

Configure your logger with various options:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app', {
  // Log level
  level: 'info', // Default log level
  defaultName: 'app', // Default logger name

  // Output formatting
  timestamp: true, // Include timestamps
  colors: true, // Use colors in output
  format: 'text', // 'text' or 'json' format
  verbose: false, // Verbose output mode

  // File management
  logDirectory: './logs', // Log file location
  maxLogSize: 10485760, // 10MB max file size
  logDatePattern: 'YYYY-MM-DD', // Date format in filenames
})
```

### Log Rotation Settings

Control how log files are managed and rotated:

```ts
const logger = new Logger('app', {
  rotation: {
    // Rotation schedule
    frequency: 'daily', // 'hourly', 'daily', 'weekly', 'monthly'
    rotateHour: 0, // Hour to rotate (0-23)
    rotateMinute: 0, // Minute to rotate (0-59)
    rotateDayOfWeek: 0, // Day for weekly rotation (0-6, Sunday is 0)
    rotateDayOfMonth: 1, // Day for monthly rotation (1-31)

    // File limits
    maxSize: 10485760, // Rotate at 10MB
    maxFiles: 5, // Keep 5 rotated files

    // File processing
    compress: false, // Compress rotated logs
    encrypt: { // Encrypt rotated logs
      algorithm: 'aes-256-gcm',
      compress: true,
    }
  }
})
```

### Configuration Examples

1. **Development Setup**

   ```ts
   const devLogger = new Logger('dev', {
     level: 'debug',
     colors: true,
     format: 'text',
     verbose: true,
     rotation: {
       maxSize: 5 * 1024 * 1024, // 5MB
       maxFiles: 3,
       compress: false,
     }
   })
   ```

2. **Production Setup**

   ```ts
   const prodLogger = new Logger('prod', {
     level: 'info',
     format: 'json',
     rotation: {
       frequency: 'daily',
       maxSize: 50 * 1024 * 1024, // 50MB
       maxFiles: 30,
       compress: true,
       encrypt: {
         algorithm: 'aes-256-gcm',
         compress: true,
       }
     }
   })
   ```

3. **High-Performance Setup**

   ```ts
   const highPerfLogger = new Logger('perf', {
     format: 'json',
     timestamp: true,
     rotation: {
       maxSize: 100 * 1024 * 1024, // 100MB
       frequency: 'hourly',
       compress: true,
     },
     // Buffer writes for better performance
     bufferSize: 1000,
     flushInterval: '5s',
   })
   ```

### Environment-Specific Configuration

Use environment variables for flexible configuration:

```ts
const logger = new Logger('app', {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'text',
  logDirectory: process.env.LOG_DIR || './logs',
  rotation: {
    maxSize: Number.parseInt(process.env.LOG_MAX_SIZE || '10485760'),
    maxFiles: Number.parseInt(process.env.LOG_MAX_FILES || '5'),
    compress: process.env.LOG_COMPRESS === 'true',
    encrypt: process.env.LOG_ENCRYPT === 'true'
      ? {
          algorithm: 'aes-256-gcm',
          compress: true,
        }
      : false,
  }
})
```

### Configuration Best Practices

1. **Security**
   - Use environment variables for sensitive settings
   - Enable encryption in production
   - Implement proper file permissions

2. **Performance**
   - Adjust buffer size based on log volume
   - Configure rotation frequency appropriately
   - Monitor disk I/O impact

3. **Maintenance**
   - Set reasonable file retention limits
   - Plan for log archival
   - Monitor disk space usage

4. **Compliance**
   - Configure retention periods per requirements
   - Enable necessary audit trails
   - Document configuration decisions

## Best Practices

1. **Use Structured Logging**

   ```ts
   // ❌ Bad
   await logger.info(`User ${name} logged in from ${ip}`)

   // ✅ Good
   await logger.info('User login', { name, ip })
   ```

2. **Consistent Naming**

   ```ts
   // ❌ Bad
   const log = new Logger('stuff')

   // ✅ Good
   const logger = new Logger('payment:stripe')
   const dbLogger = new Logger('database:postgres')
   ```

3. **Error Context**

   ```ts
   // ❌ Bad
   await logger.error(error.message)

   // ✅ Good
   await logger.error('Operation failed', {
     error: {
       message: error.message,
       code: error.code,
       stack: error.stack,
     },
     context: { /* operation details */ },
   })
   ```

4. **Performance Awareness**

   ```ts
   // ❌ Bad
   logger.debug('State:', deepCloneObject(state))

   // ✅ Good
   logger.only(() => {
     logger.debug('State:', deepCloneObject(state))
   })
   ```

## Next Steps

- Explore [Configuration Options](./config) for customization
- Learn about [CLI Tools](./cli) for log management
- See [Library Reference](./library) for detailed API docs
