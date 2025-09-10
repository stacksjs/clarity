# Formatting

Clarity provides flexible formatting options for log messages, helping you create clear, structured, and readable logs.

## Format Strings

Clarity supports format string placeholders similar to `printf` in C or `console.log` in JavaScript:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app')

// Basic string placeholder
await logger.info('Hello, %s!', 'world') // "Hello, world!"

// Number placeholder
await logger.info('Found %d errors', 3) // "Found 3 errors"

// JSON placeholder for objects
await logger.info('User data: %j', { name: 'Alice', role: 'admin' })
// "User data: {"name":"Alice","role":"admin"}"

// Object placeholder (similar to JSON but preserves strings)
await logger.info('Config: %o', { server: 'api.example.com', port: 443 })
// "Config: {"server":"api.example.com","port":443}"
```

### Available Placeholders

| Placeholder | Type | Description |
|-------------|------|-------------|
| `%s` | String | Inserts string value |
| `%d` or `%i` | Number | Inserts number value |
| `%j` | JSON | Serializes value as JSON |
| `%o` | Object | Like JSON but preserves string values |

## Color Formatting

Clarity provides color formatting for terminal output:

```ts
import { blue, colorize, green, Logger, red } from 'clarity'

const logger = new Logger('app')

// Using color utilities directly
logger.info(`Status: ${colorize('ONLINE', green)}`)

// Using predefined colors
logger.info(`${red}Error:${reset} Connection failed`)
```

Available colors include:

```txt
# Foreground colors
black, red, green, yellow, blue, magenta, cyan, white, gray

# Background colors
bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite

# Styles
reset, bold, dim
```

## Output Formats

Clarity supports different output formats:

### Text Format (Default)

Human-readable format with timestamps, levels, and colored output:

```txt
[2024-03-15 14:30:45] [INFO] [app] Server started on port 3000
[2024-03-15 14:30:46] [ERROR] [app:database] Connection failed: timeout
```

### JSON Format

Structured format for machine processing:

```ts
const logger = new Logger('app', { format: 'json' })

await logger.info('Server started', { port: 3000 })
```

Output:

```json
{ "timestamp": "2024-03-15T14:30:45.123Z", "level": "info", "name": "app", "message": "Server started", "metadata": { "port": 3000 } }
```

## Custom Formatters

You can create custom formatters by implementing the `Formatter` interface:

```ts
import { Formatter, LogEntry, Logger } from 'clarity'

// Create a custom formatter
const csvFormatter: Formatter = {
  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry
    return `${timestamp.toISOString()},${level},${name},"${message}"\n`
  }
}

// Use custom formatter
const logger = new Logger('app', { formatter: csvFormatter })
```

## Timestamp Formatting

Control timestamp display in logs:

```ts
// Default ISO timestamp
const logger1 = new Logger('app', { timestamp: true })

// Custom timestamp format
const logger2 = new Logger('app', {
  timestamp: new Date(),
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
})

// Disable timestamps
const logger3 = new Logger('app', { timestamp: false })
```

## Tag Formatting

Customize how namespace tags appear in logs:

```ts
const logger = new Logger('app', {
  showTags: true,
  tagFormat: {
    prefix: '[',
    suffix: ']'
  }
})

await logger.info('Hello') // "[app] Hello"

const dbLogger = logger.extend('db')
await dbLogger.info('Connected') // "[app:db] Connected"
```

## Box Formatting

Create attention-grabbing boxed messages:

```ts
await logger.box('Application Started')
```

Output:

```txt
┌─────────────────────────┐
│ Application Started     │
└─────────────────────────┘
```

## Stripping ANSI Colors

Remove color codes from log output:

```ts
import { stripColors } from 'clarity'

const coloredText = `${red}Error:${reset} Failed`
const plainText = stripColors(coloredText) // "Error: Failed"
```

Clarity's flexible formatting options help you create logs that are useful for both humans and machines.

## Hyperlinks (OSC 8)

Clarity renders Markdown-style links as clickable hyperlinks in capable terminals like Ghostty.

- `[Ghostty docs](https://ghostty.org/docs)` becomes a clickable link.
- Local files are converted into `file://` links if they exist, e.g. `[open log](./logs/app.log)`.

```ts
import { Logger } from 'clarity'

const logger = new Logger('docs')

await logger.info('Read the [Ghostty docs](https://ghostty.org/docs)')
await logger.info('Open the [latest log](./logs/app.log)')
```

Notes

- OSC 8 link emission is enabled automatically in Ghostty and other supported terminals.
- You can disable or force-enable via environment variables: `NO_OSC8=1` or `FORCE_OSC8=1`.
- When unsupported or disabled, links gracefully degrade to styled text.
