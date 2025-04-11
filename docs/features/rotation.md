# Log Rotation

Log rotation is an essential feature for managing log files in production environments. Clarity provides flexible log rotation capabilities to:

- Prevent log files from growing too large
- Maintain a history of log files for a specified period
- Optimize disk usage through compression
- Ensure logs are organized and easily accessible

## Basic Rotation

Rotation can be enabled when creating a logger:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app', {
  rotation: {
    frequency: 'daily',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 7,
    compress: true,
  },
})
```

## Rotation Methods

Clarity supports multiple rotation strategies:

### Time-based Rotation

Time-based rotation creates new log files at specified intervals:

```ts
const logger = new Logger('app', {
  rotation: {
    // Rotate logs daily at midnight
    frequency: 'daily',

    // Rotate logs weekly on Sunday at midnight
    frequency: 'weekly',
    rotateDayOfWeek: 0, // 0 = Sunday

    // Rotate logs monthly on the 1st at midnight
    frequency: 'monthly',
    rotateDayOfMonth: 1,

    // Rotate at specific time (3:30 AM)
    rotateHour: 3,
    rotateMinute: 30,
  },
})
```

### Size-based Rotation

Rotate logs when they reach a specified size:

```ts
const logger = new Logger('app', {
  rotation: {
    // Rotate when file exceeds 10MB
    maxSize: 10 * 1024 * 1024,
  },
})
```

### Combined Approach

For production environments, it's often best to combine time and size-based rotation:

```ts
const logger = new Logger('app', {
  rotation: {
    // Time-based rotation
    frequency: 'daily',

    // Size-based rotation
    maxSize: 10 * 1024 * 1024, // 10MB

    // Whichever happens first will trigger rotation
  },
})
```

## Retention Policies

Control how long rotated logs are kept:

```ts
const logger = new Logger('app', {
  rotation: {
    // Keep at most 10 rotated files
    maxFiles: 10,

    // Delete logs older than 30 days
    maxAge: 30,
  },
})
```

## Compression

Compress rotated log files to save disk space:

```ts
const logger = new Logger('app', {
  rotation: {
    // Enable compression (gzip)
    compress: true,
  },
})
```

Compressed files will have a `.gz` extension.

## File Naming

Rotated log files follow a predictable naming pattern:

```
appname-YYYY-MM-DD.log         // Current log file
appname-YYYY-MM-DD-HH-MM-SS.log // Rotated log file
appname-YYYY-MM-DD-HH-MM-SS.log.gz // Compressed rotated log file
```

You can customize the naming pattern with the `pattern` option:

```ts
const logger = new Logger('app', {
  rotation: {
    // Custom pattern
    pattern: '%DATE%-%INSTANCE%.log',
  },
})
```

## Manual Rotation

You can also trigger rotation programmatically:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Manually rotate logs
await logger.rotateLog()
```

This is useful when you need to force rotation based on application events, such as a deployment or configuration change.

## Handling Rotation Failures

Clarity is designed to handle rotation failures gracefully:

1. If a rotation operation fails, the error is logged and the original log file continues to be used
2. Pending log writes are preserved and not lost during rotation
3. Automatic retries are performed for temporary failures

## Advanced Example

A complete rotation configuration with all options:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app', {
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
    maxFiles: 30,
    maxAge: 90, // days

    // Compression
    compress: true,

    // Custom pattern
    pattern: '%APP%-%DATE%.log',

    // Encryption (see Encryption feature)
    encrypt: true,
  },
})
```

## Performance Considerations

Log rotation is designed to be performed efficiently:

1. Rotation operations happen asynchronously to avoid blocking the main thread
2. File system operations are properly synchronized to prevent race conditions
3. Compression is performed in a separate process to minimize CPU impact

For high-volume logging, consider:

- Using size-based rotation with a larger file size limit
- Setting appropriate retention policies to manage disk usage
- Implementing a log shipping strategy to offload logs to a centralized system

## Best Practices

1. **Enable rotation in production**: Always use log rotation in production environments
2. **Set appropriate limits**: Choose size and time limits based on your application's logging volume
3. **Configure retention**: Set maxFiles and maxAge to control disk usage
4. **Use compression**: Enable compression for long-term storage
5. **Monitor rotated logs**: Implement a strategy to archive or analyze rotated logs
