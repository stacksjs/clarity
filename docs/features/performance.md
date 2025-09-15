# Performance Tracking

Clarity includes built-in performance tracking capabilities that help you measure and monitor the execution time of operations in your application.

## Basic Timing

The `time()` method starts a timer and returns a function that, when called, logs the elapsed time:

```ts
import { Logger } from 'clarity'

const logger = new Logger('performance')

// Start timing an operation
const end = logger.time('Database query')

// Perform the operation
await db.query('SELECT * FROM users')

// End timing and log the result
await end() // Outputs: "Database query completed in 123ms"

// You can also provide additional metadata when ending the timer
await end({ rows: 100, cached: false })
// Outputs: "Database query completed in 123ms" with metadata
```

## Tracking Multiple Operations

Track multiple concurrent operations independently:

```ts
const end1 = logger.time('Operation 1')
const end2 = logger.time('Operation 2')

// Perform operations concurrently
await Promise.all([
  someAsyncOperation().then(() => end1()),
  anotherAsyncOperation().then(() => end2())
])
```

## Progress Tracking

For long-running operations, track progress with visual indicators:

```ts
const logger = new Logger('app', { fancy: true })

// Create a progress tracker with total items to process
const progress = logger.progress(100, 'Processing files')

for (let i = 0; i < 100; i++) {
  // Update progress with current position and message
  progress.update(i, `Processing file ${i + 1}/100`)

  // Perform work
  await processFile(i)
}

// Mark progress as complete
progress.finish('All files processed successfully')
```

### Loading / Progress Demo

For a smooth, GPU-accelerated terminal rendering experience, we recommend using [Ghostty](https://ghostty.org/). The following demo shows Clarity's progress output in Ghostty:

![Clarity progress in Ghostty](https://dummyimage.com/1200x400/0a0abc/ffffff&text=Clarity+progress+in+Ghostty)

To use your own GIF, add it at `docs/public/images/progress-ghostty.gif` and replace the placeholder URL above with `/images/progress-ghostty.gif`.

The progress bar includes these methods:

- `update(current, message?)`: Update progress position and optional message
- `finish(message?)`: Complete the progress operation with success message
- `interrupt(message, level?)`: Temporarily interrupt progress to show a message

## Start/End Pattern

For simpler timing needs, use the start/end pattern:

```ts
// Start timing with a message
await logger.start('Initializing application')

// ... perform initialization ...

// Log a success message with elapsed time automatically included
await logger.success('Application initialized')
```

## Performance Tips

- **Selective Timing**: Only enable detailed performance tracking in development or when troubleshooting
- **Appropriate Level**: Use `debug` level for routine timing and `info` for important operations
- **Contextual Data**: Include relevant metadata when ending timers to correlate performance with context
- **Hierarchical Timing**: Use namespaced loggers to organize performance metrics by component

## Integration with Monitoring

Clarity's performance tracking can be integrated with external monitoring systems:

```ts
const logger = new Logger('metrics')

// Custom timing with callback to external metrics system
const end = logger.time('api.request')

// Perform operation
const response = await fetch('/api/data')

// End timing and send metrics externally
const elapsed = await end()
metricsSystem.recordLatency('api.request', elapsed)
```

Performance tracking is a key part of understanding your application's behavior. Combine it with Clarity's other logging features for comprehensive application insights.
