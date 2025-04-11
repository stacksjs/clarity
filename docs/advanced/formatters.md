# Advanced Formatters

Clarity provides extensive formatting capabilities through its formatter system. This page covers how to work with built-in formatters and create custom formatters for your specific needs.

## Formatter Interface

All formatters implement the `Formatter` interface:

```ts
interface Formatter {
  format: (entry: LogEntry, forFile?: boolean) => Promise<string>
  formatForFile?: (entry: LogEntry) => Promise<string>
}
```

The interface requires:

- A `format` method that converts a log entry to a string
- An optional `formatForFile` method specifically for file output

## Built-in Formatters

Clarity includes several built-in formatters:

### Text Formatter

The default text formatter creates human-readable log entries with timestamps, levels, namespaces, and messages:

```
[2024-03-15 14:30:45] [INFO] [app] Server started on port 3000
```

It supports:

- Color coding by log level
- Customizable timestamp formats
- Namespace tags with configurable prefixes/suffixes

### JSON Formatter

The JSON formatter outputs structured logs suitable for machine processing:

```json
{
  "timestamp": "2024-03-15T14:30:45.123Z",
  "level": "info",
  "name": "app",
  "message": "Server started",
  "metadata": {
    "port": 3000
  }
}
```

### Pretty Formatter

The pretty formatter enhances readability with:

- Indentation for nested objects
- Colorization based on data types and log levels
- Special handling for errors and stack traces
- Icons based on log level

## Creating Custom Formatters

You can create custom formatters for specialized needs:

```ts
import { Formatter, LogEntry } from 'clarity'

// Example: CSV Formatter
const csvFormatter: Formatter = {
  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry
    return `${timestamp.toISOString()},${level},${name},"${message}"\n`
  },

  // Optional separate format for file output
  async formatForFile(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry
    // Include additional fields for file output
    return `${timestamp.toISOString()},${level},${name},"${message}",${process.pid}\n`
  }
}

// Use custom formatter
const logger = new Logger('app', { formatter: csvFormatter })
```

## Format Utilities

Clarity provides utilities for formatting specific parts of log entries:

### String Formatting

```ts
import { format } from 'clarity'

// Format with placeholders
const message = format('Found %d errors in %s', 3, 'document.txt')
// "Found 3 errors in document.txt"

// JSON placeholder
const json = format('Data: %j', { user: 'alice', role: 'admin' })
// "Data: {"user":"alice","role":"admin"}"

// Object placeholder (preserves strings)
const obj = format('Config: %o', { server: 'api.example.com', port: 443 })
// "Config: {"server":"api.example.com","port":443}"
```

### Color Formatting

```ts
import { blue, colorize, green, red, reset, stripColors } from 'clarity'

// Wrap text with color
const status = colorize('SUCCESS', green)

// Multiple colors in text
const message = `${blue}Info:${reset} ${green}Operation complete${reset}`
const plainText = stripColors(coloredText)
```

## Advanced Formatter Examples

### XML Formatter

```ts
const xmlFormatter: Formatter = {
  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry
    const args = entry.args ? entry.args : []

    let xml = `<log>
  <timestamp>${timestamp.toISOString()}</timestamp>
  <level>${level}</level>
  <name>${name}</name>
  <message>${escapeXml(message)}</message>`

    if (args.length > 0) {
      xml += `
  <args>
    ${args.map((arg, i) => `<arg index="${i}">${typeof arg === 'object' ? JSON.stringify(arg) : arg}</arg>`).join('\n    ')}
  </args>`
    }

    xml += '\n</log>\n'

    return xml
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
```

### Markdown Formatter

```ts
const markdownFormatter: Formatter = {
  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry
    const formattedTimestamp = timestamp.toISOString()

    // Format level as markdown heading size
    const headingLevel = level === 'error'
      ? '###'
      : level === 'warning' ? '##' : '#'

    let md = `${headingLevel} [${name}] ${message}\n\n`
    md += `*${formattedTimestamp}* | **${level.toUpperCase()}**\n\n`

    // Add args as code blocks if present
    if (entry.args && entry.args.length > 0) {
      entry.args.forEach((arg, index) => {
        if (typeof arg === 'object') {
          md += `\`\`\`json\n${JSON.stringify(arg, null, 2)}\n\`\`\`\n\n`
        }
        else if (arg instanceof Error) {
          md += `\`\`\`\n${arg.stack}\n\`\`\`\n\n`
        }
        else {
          md += `\`${arg}\`\n\n`
        }
      })
    }

    md += '---\n\n'

    return md
  }
}
```

## Integrating with External Systems

Custom formatters can be used to integrate with external logging systems:

```ts
// Formatter for Elasticsearch/Logstash format
const elasticsearchFormatter: Formatter = {
  async format(entry: LogEntry): Promise<string> {
    const { timestamp, level, name, message } = entry

    const elasticDoc = {
      '@timestamp': timestamp.toISOString(),
      'log': {
        level,
        logger: name,
        message
      },
      'process': {
        pid: process.pid,
        name: process.title || 'node'
      },
      'host': {
        hostname: os.hostname()
      }
    }

    // Add args as metadata if present
    if (entry.args && entry.args.length > 0) {
      elasticDoc.metadata = entry.args.reduce((acc, arg, i) => {
        if (typeof arg === 'object' && arg !== null) {
          return { ...acc, ...arg }
        }
        return { ...acc, [`arg${i}`]: arg }
      }, {})
    }

    return `${JSON.stringify(elasticDoc)}\n`
  }
}
```

By leveraging the formatter system, you can adapt Clarity's output to suit any logging requirements or external systems.
