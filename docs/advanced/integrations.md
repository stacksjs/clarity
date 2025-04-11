# Integrations

Clarity is designed to integrate seamlessly with other tools and systems in your logging and monitoring stack. This guide covers how to integrate Clarity with popular logging aggregators, monitoring systems, and frameworks.

## Log Aggregation Systems

### ELK Stack (Elasticsearch, Logstash, Kibana)

Clarity can be configured to output logs in a format compatible with the ELK stack:

```ts
import { Logger } from 'clarity'
import { ElasticsearchFormatter } from './custom-formatters'

// Create a logger with Elasticsearch-friendly output
const logger = new Logger('app', {
  format: 'json',
  formatter: new ElasticsearchFormatter({
    addMetadata: true,
    includeHostInfo: true,
  }),
})
```

Example custom Elasticsearch formatter:

```ts
import os from 'node:os'
import { Formatter, LogEntry } from 'clarity'

class ElasticsearchFormatter implements Formatter {
  constructor(private options: { addMetadata: boolean, includeHostInfo: boolean }) {}

  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message, args } = entry

    const doc = {
      '@timestamp': timestamp.toISOString(),
      'log': {
        level,
        logger: name,
        message,
      },
    }

    // Add host info if configured
    if (this.options.includeHostInfo) {
      doc.host = {
        hostname: os.hostname(),
        architecture: os.arch(),
        platform: os.platform(),
      }
    }

    // Add additional metadata from args
    if (this.options.addMetadata && args?.length) {
      const metadata = args.reduce((acc, arg) => {
        if (typeof arg === 'object' && arg !== null) {
          return { ...acc, ...arg }
        }
        return acc
      }, {})

      if (Object.keys(metadata).length) {
        doc.metadata = metadata
      }
    }

    return JSON.stringify(doc)
  }
}
```

### Datadog

Integration with Datadog using the Datadog agent:

```ts
import { Logger } from 'clarity'
import { DatadogFormatter } from './datadog-formatter'

const logger = new Logger('app', {
  formatter: new DatadogFormatter({
    service: 'api-service',
    env: process.env.NODE_ENV,
    version: '1.0.0',
  }),
})
```

Example Datadog formatter:

```ts
import { Formatter, LogEntry } from 'clarity'

class DatadogFormatter implements Formatter {
  constructor(private config: { service: string, env: string, version: string }) {}

  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, message, name } = entry

    return JSON.stringify({
      timestamp: Math.floor(timestamp.getTime() / 1000),
      message,
      level,
      logger: {
        name,
      },
      service: this.config.service,
      ddsource: 'nodejs',
      ddtags: `env:${this.config.env},version:${this.config.version}`,
      // Add additional metadata from args if available
      ...this.extractMetadata(entry.args),
    })
  }

  private extractMetadata(args?: any[]): Record<string, any> {
    if (!args || !args.length)
      return {}

    return args.reduce((acc, arg) => {
      if (typeof arg === 'object' && arg !== null) {
        return { ...acc, ...arg }
      }
      return acc
    }, {})
  }
}
```

## Cloud Logging Providers

### AWS CloudWatch

Send logs to AWS CloudWatch:

```ts
import { Logger } from 'clarity'
import { CloudWatchTransport } from './cloudwatch-transport'

const logger = new Logger('app', {
  level: 'info',
})

// Add CloudWatch transport
const cloudwatchTransport = new CloudWatchTransport({
  logGroupName: '/app/api',
  logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
  region: 'us-west-2',
})

logger.addTransport(cloudwatchTransport)
```

Example CloudWatch transport implementation:

```ts
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'
import { LogEntry, Transport } from './transport-interface'

class CloudWatchTransport implements Transport {
  private cloudwatch: CloudWatchLogs
  private buffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout

  constructor(private config: {
    logGroupName: string
    logStreamName: string
    region: string
    batchSize?: number
    flushIntervalMs?: number
  }) {
    this.cloudwatch = new CloudWatchLogs({
      region: config.region,
    })

    // Create log group and stream if they don't exist
    this.initializeLogGroup()

    // Set up flush interval
    this.flushInterval = setInterval(() => {
      this.flush()
    }, config.flushIntervalMs || 5000)
  }

  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry)

    if (this.buffer.length >= (this.config.batchSize || 20)) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0)
      return

    const events = this.buffer.map(entry => ({
      timestamp: entry.timestamp.getTime(),
      message: JSON.stringify({
        level: entry.level,
        message: entry.message,
        logger: entry.name,
        ...(entry.args?.length ? { metadata: entry.args } : {}),
      }),
    }))

    try {
      await this.cloudwatch.putLogEvents({
        logGroupName: this.config.logGroupName,
        logStreamName: this.config.logStreamName,
        logEvents: events,
      })

      this.buffer = []
    }
    catch (err) {
      console.error('Failed to send logs to CloudWatch:', err)
    }
  }

  async destroy(): Promise<void> {
    clearInterval(this.flushInterval)
    await this.flush()
  }

  private async initializeLogGroup(): Promise<void> {
    // Implementation to create log group/stream if needed
  }
}
```

### Google Cloud Logging

Integration with Google Cloud Logging:

```ts
import { Logger } from 'clarity'
import { GCPLogFormatter } from './gcp-formatter'

const logger = new Logger('app', {
  formatter: new GCPLogFormatter({
    projectId: 'my-gcp-project',
    serviceContext: {
      service: 'api',
      version: '1.0.0',
    },
  }),
})
```

## Framework Integrations

### Express.js

Integrate Clarity with Express.js for HTTP request logging:

```ts
import { Logger } from 'clarity'
import express from 'express'

const app = express()
const logger = new Logger('express')

// Request logging middleware
app.use((req, res, next) => {
  const startTime = performance.now()

  // Log when request is received
  logger.info(`${req.method} ${req.url} - Request received`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    headers: req.headers,
  })

  // Override end to log response
  const originalEnd = res.end
  res.end = function (...args) {
    const duration = Math.round(performance.now() - startTime)

    logger.info(`${req.method} ${req.url} - Response sent`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    })

    return originalEnd.apply(this, args)
  }

  next()
})

// Error logging middleware
app.use((err, req, res, next) => {
  logger.error('Express error middleware caught exception', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
  })

  res.status(500).json({ error: 'Internal Server Error' })
})
```

### NestJS

Create a custom NestJS logger using Clarity:

```ts
import { LoggerService } from '@nestjs/common'
import { Logger } from 'clarity'

export class ClarityLogger implements LoggerService {
  private logger: Logger
  private contextLogger: Record<string, Logger> = {}

  constructor() {
    this.logger = new Logger('nest')
  }

  log(message: any, context?: string): void {
    this.getContextLogger(context).info(message)
  }

  error(message: any, trace?: string, context?: string): void {
    this.getContextLogger(context).error(message)
    if (trace) {
      this.getContextLogger(context).debug(trace)
    }
  }

  warn(message: any, context?: string): void {
    this.getContextLogger(context).warn(message)
  }

  debug(message: any, context?: string): void {
    this.getContextLogger(context).debug(message)
  }

  verbose(message: any, context?: string): void {
    this.getContextLogger(context).debug(message)
  }

  private getContextLogger(context?: string): Logger {
    if (!context) {
      return this.logger
    }

    if (!this.contextLogger[context]) {
      this.contextLogger[context] = this.logger.extend(context)
    }

    return this.contextLogger[context]
  }
}
```

Usage in NestJS main.ts:

```ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ClarityLogger } from './clarity-logger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ClarityLogger(),
  })

  await app.listen(3000)
}

bootstrap()
```

## Database Integrations

### MongoDB

Track MongoDB operations:

```ts
import { Logger } from 'clarity'
import { MongoClient } from 'mongodb'

const logger = new Logger('mongodb')
const dbLogger = logger.extend('operations')

async function connectWithLogging() {
  const client = new MongoClient('mongodb://localhost:27017')

  // Log connection events
  client.on('serverOpening', (event) => {
    logger.info(`Opening connection to ${event.address}`)
  })

  client.on('serverClosed', (event) => {
    logger.info(`Closed connection to ${event.address}`)
  })

  client.on('error', (error) => {
    logger.error('MongoDB error', error)
  })

  // Connect with command monitoring for query logging
  await client.connect()

  // Enable command monitoring
  const db = client.db('myapp')
  db.addListener('commandStarted', (event) => {
    dbLogger.debug(`Command started: ${event.commandName}`, {
      db: event.databaseName,
      command: event.command,
    })
  })

  db.addListener('commandSucceeded', (event) => {
    dbLogger.debug(`Command succeeded: ${event.commandName}`, {
      db: event.databaseName,
      duration: event.duration,
    })
  })

  db.addListener('commandFailed', (event) => {
    dbLogger.error(`Command failed: ${event.commandName}`, {
      db: event.databaseName,
      error: event.failure,
      duration: event.duration,
    })
  })

  return { client, db }
}
```

## Creating Custom Integrations

The flexibility of Clarity allows you to create custom integrations with any system. The key components for integration are:

1. **Custom Formatters**: Create formatters that output logs in the format expected by your target system
2. **Transport Adapters**: Implement custom transport adapters to send logs to external services
3. **Integration Middleware**: Create middleware for frameworks to automatically log relevant information

### Transport Adapter Pattern

```ts
// Define a Transport interface
interface Transport {
  write: (entry: LogEntry) => Promise<void>
  flush?: () => Promise<void>
  destroy?: () => Promise<void>
}

// Extend Logger to support transports
class EnhancedLogger extends Logger {
  private transports: Transport[] = []

  addTransport(transport: Transport): void {
    this.transports.push(transport)
  }

  async log(level: LogLevel, message: string, ...args: any[]): Promise<void> {
    // First, log normally using parent implementation
    await super.log(level, message, ...args)

    // Then send to all transports
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      args,
      name: this.name,
    }

    await Promise.all(this.transports.map(transport => transport.write(entry)))
  }

  async destroy(): Promise<void> {
    // Destroy all transports
    await Promise.all(this.transports.map(async (transport) => {
      if (transport.flush) {
        await transport.flush()
      }
      if (transport.destroy) {
        await transport.destroy()
      }
    }))

    // Call parent destroy
    await super.destroy()
  }
}
```

By leveraging these integration patterns, Clarity can easily become part of a comprehensive logging and monitoring stack for your applications.
