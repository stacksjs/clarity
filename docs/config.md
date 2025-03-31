# Configuration Guide

Clarity offers flexible configuration options to suit your needs, from basic logging setup to advanced production features. This guide covers all available configuration methods and options.

## Configuration Methods

### 1. Programmatic Configuration

The most direct way to configure Clarity is through code:

```ts
import type { ClarityConfig } from 'clarity'
import { Logger } from 'clarity'

const logger = new Logger('app', {
  // Basic Settings
  level: 'debug',
  format: 'json',
  timestamp: true,
  colors: true,

  // Log Management
  maxLogSize: 5 * 1024 * 1024, // 5MB
  maxLogFiles: 10,
  logDirectory: '~/.clarity/logs',

  // Advanced Features
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    compress: true,
  },

  fingersCrossed: {
    activationLevel: 'error',
    bufferSize: 50,
    flushOnDeactivation: true,
  },

  // Security
  encrypt: true,
  encryptionKey: process.env.LOG_ENCRYPTION_KEY,
})
```

### 2. Environment Variables

Control logging behavior through environment variables:

```bash
# Enable Logging
DEBUG=true                # Enable all logging
DEBUG=api:*              # Enable all API-related logs
DEBUG=api:auth           # Enable only API auth logs

# Log Levels
LOG_LEVEL=debug         # Show all logs
LOG_LEVEL=error         # Show only errors

# Configuration
CLARITY_MAX_SIZE=5242880    # 5MB max file size
CLARITY_MAX_FILES=10        # Keep 10 rotated files
CLARITY_COMPRESS=true       # Compress rotated files
CLARITY_LOG_DIR=/logs      # Custom log directory
```

### 3. CLI Configuration

Manage settings through the CLI:

```bash
# View current configuration
clarity config list

# Get specific setting
clarity config get maxLogSize

# Update settings
clarity config set --level debug
clarity config set --maxLogSize 5242880
clarity config set --compress true
```

## Configuration Options

### Basic Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string | 'info' | Log level ('debug', 'info', 'success', 'warning', 'error') |
| `format` | string | 'text' | Output format ('text' or 'json') |
| `timestamp` | boolean/string | true | Show timestamps (true/false or format string) |
| `colors` | boolean | true | Enable colored output |

### Output Formatting

```ts
const logger = new Logger('app', {
  // Timestamp options
  timestamp: 'YYYY-MM-DD HH:mm:ss',

  // Color customization
  colors: {
    debug: 'gray',
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  },

  // Format string support
  formatters: {
    j: v => JSON.stringify(v, null, 2),
    s: String,
    d: Number
  }
})
```

### Log Rotation

```ts
const logger = new Logger('app', {
  rotation: {
    // Size-based rotation
    maxSize: '10MB',
    maxFiles: 5,

    // Time-based rotation
    frequency: 'daily',
    hour: 0,
    minute: 0,

    // Cleanup
    maxAge: '7d',
    compress: true
  }
})
```

### Fingers-Crossed Logging

Buffer logs until an important event occurs:

```ts
const logger = new Logger('app', {
  fingersCrossed: {
    activationLevel: 'error', // Start saving when error occurs
    bufferSize: 50, // Keep last 50 messages
    flushOnDeactivation: true, // Save buffer when deactivated
    timeout: '1h' // Auto-deactivate after 1 hour
  }
})
```

### Security Options

```ts
const logger = new Logger('app', {
  // Encryption
  encrypt: true,
  encryptionKey: process.env.LOG_ENCRYPTION_KEY,
  algorithm: 'aes-256-gcm',

  // Access control
  permissions: 0o600, // File permissions
  owner: 'app-user', // File owner
})
```

## Configuration Precedence

Settings are applied in this order (later overrides earlier):

1. Default values
2. Global configuration file
3. Environment variables
4. Programmatic configuration
5. CLI overrides

## Best Practices

1. **Environment-specific Configuration**

   ```ts
   const logger = new Logger('app', {
     level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
     format: process.env.NODE_ENV === 'production' ? 'json' : 'text'
   })
   ```

2. **Secure Sensitive Information**

   ```ts
   const logger = new Logger('app', {
     // Use environment variables for sensitive data
     encryptionKey: process.env.LOG_ENCRYPTION_KEY,

     // Mask sensitive data in logs
     formatters: {
       password: () => '******',
       ssn: v => v.replace(/\d{3}-\d{2}-(\d{4})/, '***-**-$1')
     }
   })
   ```

3. **Performance Optimization**

   ```ts
   const logger = new Logger('app', {
     // Buffer logs for better performance
     bufferSize: 100,
     flushInterval: '5s',

     // Compress old logs
     rotation: {
       compress: true,
       compressAfter: '1d'
     }
   })
   ```

## Next Steps

- Learn about CLI usage in the [CLI Guide](./cli)
- See advanced patterns in the [Library Guide](./library)
