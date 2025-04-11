# Features

Clarity is a powerful logging and debugging library designed to enhance your development workflow with a wide range of features.

## Core Features

### 🚀 High-Performance Logging

Clarity provides high-performance logging with minimal overhead, making it suitable for both development and production environments. It uses stream-based output and efficient formatting to ensure your logs don't become a bottleneck.

### 🎯 Domain-Specific Namespaces

Organize logs with hierarchical namespaces that allow you to categorize and filter your logs based on application components. Create separate loggers for different parts of your application and easily enable or disable them as needed.

```ts
const logger = new Logger('app')
const authLogger = logger.extend('auth')
const dbLogger = logger.extend('database')

await authLogger.info('User authenticated') // [app:auth] User authenticated
await dbLogger.error('Connection failed') // [app:database] Connection failed
```

### 🤞 Fingers-Crossed Log Buffering

The "fingers-crossed" logging pattern keeps a buffer of recent logs of all levels, but only writes them to storage when a higher severity event occurs. This gives you full context around errors without the noise of debug-level logs during normal operation.

```ts
const logger = new Logger('app', {
  fingersCrossed: {
    activationLevel: 'error',
    bufferSize: 50,
    flushOnDeactivation: true,
  }
})
```

### 🔄 Automatic Log Rotation & Cleanup

Clarity handles log file management automatically by rotating logs based on size, time intervals, or custom conditions. Configure rotation frequency, compression, and cleanup policies to maintain your logs without manual intervention.

### 🔐 Encrypted Log Storage

Secure sensitive log data with built-in encryption support. Clarity can encrypt your log files and manage encryption keys with automatic rotation for enhanced security.

## Output & Formatting

### 🎨 Rich Color-Coded Console Output

Improve readability with color-coded log output that distinguishes between different log levels, namespaces, and message types.

### 📊 Multiple Log Levels

Clarity supports multiple log levels - `debug`, `info`, `success`, `warn`, `error` - letting you control verbosity and filter logs based on importance.

### 🔠 Format String Support

Use format string placeholders like `%s`, `%d`, `%j` for strings, numbers, and JSON data:

```ts
logger.info('Found %d errors in %s', 3, 'document.txt')
```

### ⚡ Built-in Performance Tracking

Track operation durations and performance metrics with built-in timing utilities:

```ts
const end = logger.time('Starting operation')
// ... do work ...
await end() // Outputs: "Starting operation completed in 123ms"
```

## Platform Support

### 🌐 Universal Platform Support

Clarity works seamlessly in both browser and server environments, with automatic detection and environment-specific optimizations.

### 🛠️ CLI & Library Access

Use Clarity programmatically as a library or via the command-line interface for log viewing, searching, and management.

### 💻 First-Class TypeScript Support

Enjoy comprehensive type definitions and a fully typed API that provides code completion and type checking.

### 📦 Lightweight Footprint

Clarity has zero external dependencies and a minimal footprint, making it suitable for any project size.

For more detailed information about specific features, explore the feature-specific pages in the sidebar.
