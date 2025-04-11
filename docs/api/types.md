# Types

The types module defines TypeScript interfaces and types used throughout the Clarity library. These types provide robust type safety and IntelliSense support.

## Log Levels

```ts
export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'
```

The `LogLevel` type defines the available log levels, from lowest to highest severity:

1. `debug` - Detailed information for debugging purposes
2. `info` - General information about the application's operation
3. `success` - Successful operations
4. `warning` - Potential issues or concerning situations
5. `error` - Errors that prevent features from working correctly

## Rotation Types

```ts
export type RotationFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'none'
```

The `RotationFrequency` type defines how often log files are rotated.

## Encryption Types

```ts
export type EncryptionAlgorithm = 'aes-256-cbc' | 'aes-256-gcm' | 'chacha20-poly1305'
```

The `EncryptionAlgorithm` type defines the supported encryption algorithms for log file encryption.

## Interfaces

### LogEntry

The `LogEntry` interface defines the structure of a log entry:

```ts
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  args?: any[]
  name: string
}
```

### KeyRotationConfig

The `KeyRotationConfig` interface defines the configuration for key rotation:

```ts
export interface KeyRotationConfig {
  enabled: boolean
  interval: number // in days
  maxKeys: number
}
```

### EncryptionConfig

The `EncryptionConfig` interface defines encryption configuration options:

```ts
export interface EncryptionConfig {
  algorithm?: EncryptionAlgorithm
  keyId?: string
  compress?: boolean
  keyRotation?: KeyRotationConfig
}
```

### RotationConfig

The `RotationConfig` interface defines log rotation configuration:

```ts
export interface RotationConfig {
  maxSize?: number
  maxFiles?: number
  maxAge?: number
  compress?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  rotateHour?: number
  rotateMinute?: number
  rotateDayOfWeek?: number
  rotateDayOfMonth?: number
  pattern?: string
  encrypt?: EncryptionConfig | boolean
  keyRotation?: {
    enabled?: boolean
    interval?: number
    maxKeys?: number
  }
}
```

### ClarityConfig

The `ClarityConfig` interface defines the complete configuration for Clarity:

```ts
export interface ClarityConfig {
  level: LogLevel
  defaultName: string
  timestamp: boolean
  colors: boolean
  format: 'text' | 'json'
  maxLogSize: number
  logDatePattern: string
  logDirectory: string
  rotation: boolean | RotationConfig
  verbose: boolean
}
```

### ClarityOptions

The `ClarityOptions` type is a partial version of `ClarityConfig` for providing optional configuration:

```ts
export type ClarityOptions = Partial<ClarityConfig>
```

### Formatter

The `Formatter` interface defines the methods required for formatting log entries:

```ts
export interface Formatter {
  format: (entry: LogEntry, forFile?: boolean) => Promise<string>
  formatForFile?: (entry: LogEntry) => Promise<string>
}
```

### LoggerOptions

The `LoggerOptions` interface defines options specific to logger instances:

```ts
export interface LoggerOptions {
  logDirectory?: string
  level?: LogLevel
  format?: 'json' | 'text'
  rotation?: RotationConfig
  timestamp?: string | number | Date
  fingersCrossed?: boolean | {
    activationLevel?: LogLevel
    bufferSize?: number
    flushOnDeactivation?: boolean
    stopBuffering?: boolean
  }
}
```

### Logger

The `Logger` interface defines the core logger functionality:

```ts
export interface Logger {
  debug: (message: string, ...args: any[]) => Promise<void>
  info: (message: string, ...args: any[]) => Promise<void>
  success: (message: string, ...args: any[]) => Promise<void>
  warn: (message: string, ...args: any[]) => Promise<void>
  error: (message: string, ...args: any[]) => Promise<void>
  destroy: () => Promise<void>
  createReadStream: () => NodeJS.ReadableStream
  decrypt?: (data: string) => Promise<string>
}
```

## Usage Examples

### Using LogLevel

```ts
import type { LogLevel } from 'clarity'

function setLogLevel(level: LogLevel) {
  // Set the log level for your application
  console.log(`Setting log level to ${level}`)
}

setLogLevel('debug') // Valid
setLogLevel('info') // Valid
// setLogLevel('trace') // Type error - 'trace' is not a valid LogLevel
```

### Creating Custom Configuration

```ts
import type { ClarityConfig, RotationConfig } from 'clarity'

const rotationConfig: RotationConfig = {
  frequency: 'daily',
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  compress: true,
}

const config: ClarityConfig = {
  level: 'info',
  defaultName: 'myapp',
  timestamp: true,
  colors: true,
  format: 'json',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: './logs',
  rotation: rotationConfig,
  verbose: false,
}
```
