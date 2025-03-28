<p align="center"><img src="https://github.com/stacksjs/clarity/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of this repo"></p>

# Introduction to Clarity

Clarity is a modern logging & debugging solution for TypeScript applications, designed to make development easier and production monitoring more powerful. Whether you're building a small application or a large-scale system, Clarity provides the tools you need for effective logging and debugging.

## Key Features

### 🎨 Beautiful Colored Output

Clarity automatically color-codes your logs for instant readability:

```ts
const logger = new Logger('app')

logger.info('Server starting...') // Blue output
logger.success('Setup complete') // Green output
logger.warn('Cache miss') // Yellow output
logger.error('Connection failed') // Red output
logger.debug('Request details:', req) // Gray output
```

### ⚡ Performance Tracking

Built-in performance monitoring for any operation:

```ts
const logger = new Logger('performance')

// Single operation tracking
const end = logger.time('Database query')
await db.users.find()
await end() // "Database query completed in 123ms"

// Multiple concurrent operations
const [query1, query2] = await Promise.all([
  trackOperation('Query 1', async () => {
    const end = logger.time('First query')
    const result = await db.query1()
    await end()
    return result
  }),
  trackOperation('Query 2', async () => {
    const end = logger.time('Second query')
    const result = await db.query2()
    await end()
    return result
  })
])
```

### 🔍 Domain-specific Logging

Organize logs by domain for better clarity:

```ts
const logger = new Logger('api')

// Create specialized loggers
const auth = logger.extend('auth')
const db = logger.extend('database')
const cache = logger.extend('cache')

// Usage
auth.info('User authenticated') // [api:auth] info
db.warn('Slow query detected') // [api:database] warning
cache.error('Cache miss') // [api:cache] error
```

### 📊 Production-Ready Features

1. **Log Rotation & Management**

   ```ts
   const logger = new Logger('app', {
     rotation: {
       maxSize: '10MB',
       maxFiles: 5,
       compress: true
     }
   })
   ```

2. **Structured Logging**

   ```ts
   logger.info('User action', {
     userId: 123,
     action: 'login',
     metadata: {
       ip: '192.168.1.1',
       timestamp: new Date()
     }
   })
   ```

3. **Error Handling**

   ```ts
   try {
     await riskyOperation()
   }
   catch (error) {
     logger.error('Operation failed', {
       error: error.message,
       stack: error.stack,
       context: { /* additional info */ }
     })
   }
   ```

### 🛠️ Powerful CLI Tools

Monitor and manage logs from the command line:

```bash
# Real-time log watching
clarity watch --level error --name "api:*"

# Search through logs
clarity search "connection failed" --level error

# Export & analyze
clarity export --format json --output logs.json
clarity tail --lines 50 --follow
```

## Getting Started

1. **Installation**

   ```bash
   bun install clarity
   # or
   npm install clarity
   ```

2. **Basic Setup**

   ```ts
   import { Logger } from 'clarity'

   const logger = new Logger('app', {
     level: 'debug',
     format: 'json',
     timestamp: true
   })
   ```

3. **Start Logging**

   ```ts
   logger.info('Application starting...')
   logger.debug('Config loaded:', config)
   logger.success('Server listening on port 3000')
   ```

## Next Steps

- Check out the [Configuration Guide](./config) for detailed setup options
- Learn about CLI usage in the [CLI Guide](./cli)
- See advanced patterns in the [Library Guide](./library)

## Stargazers

[![Stargazers over time](https://starchart.cc/stacksjs/clarity.svg?variant=adaptive)](https://starchart.cc/stacksjs/clarity)

## Community & Support

- [GitHub Discussions](https://github.com/stacksjs/clarity/discussions) for questions & help
- [Discord Community](https://discord.gg/stacksjs) for real-time chat
- [GitHub Issues](https://github.com/stacksjs/clarity/issues) for bugs & feature requests

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/stacksjs/stacks/blob/main/.github/CONTRIBUTING.md) for details.

## Postcardware

Two things are true: Stacks OSS will always stay open-source, and we do love to receive postcards from wherever Stacks is used! _We also publish them on our website._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [debug](https://github.com/debug-js/debug)
- [@open-draft/logger](https://github.com/open-draft/logger)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/clarity/contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/clarity/blob/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/clarity/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/clarity -->
