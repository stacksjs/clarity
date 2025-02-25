# CLI Guide

Clarity's CLI provides powerful tools for log management, monitoring, and analysis. This guide covers all available commands and their usage.

## Quick Reference

```bash
clarity <command> [options]

Commands:
  watch    Monitor logs in real-time
  log      Send one-off log messages
  export   Save logs to a file
  tail     Show and follow log output
  search   Search through logs
  clear    Clear log history
  config   Manage configuration
```

## Watch Command

Monitor logs in real-time with powerful filtering:

```bash
clarity watch [options]

Options:
  --level <level>     Filter by log level (debug|info|warning|error)
  --name <pattern>    Filter by logger name (e.g., "api:*")
  --json             Output in JSON format
  --timestamp        Include timestamps
  --color           Enable colored output
  --verbose         Show detailed information

Examples:
# Watch all error logs
clarity watch --level error

# Watch specific domain with JSON output
clarity watch --name "api:auth" --json

# Watch multiple patterns
clarity watch --name "api:*,db:*" --level warning

# Watch with timestamp and colors
clarity watch --timestamp --color
```

## Log Command

Send log messages directly from the CLI:

```bash
clarity log <message> [options]

Options:
  --level <level>    Log level (default: info)
  --name <name>      Logger name
  --json            Use JSON format
  --meta <json>     Add metadata as JSON

Examples:
# Simple log message
clarity log "Deployment started"

# Error with metadata
clarity log "Deploy failed" --level error --meta '{"env":"prod","version":"1.2.3"}'

# Domain-specific logging
clarity log "Cache cleared" --name "system:cache" --level info
```

## Export Command

Export logs with flexible filtering and formatting:

```bash
clarity export [options]

Options:
  --format <format>   Output format (json|text|csv)
  --output <file>     Output file path
  --level <level>     Filter by log level
  --name <pattern>    Filter by logger name
  --start <date>      Start date (ISO format)
  --end <date>        End date (ISO format)
  --compress         Compress output file

Examples:
# Export all errors to JSON
clarity export --level error --format json --output errors.json

# Export specific date range
clarity export --start 2024-01-01 --end 2024-01-31 --output january-logs.json

# Export with compression
clarity export --output logs.json.gz --compress

# Export specific domains
clarity export --name "api:*" --format csv --output api-logs.csv
```

## Tail Command

View and follow log output:

```bash
clarity tail [options]

Options:
  --lines <n>        Number of lines (default: 10)
  --follow          Follow log output
  --level <level>    Filter by log level
  --name <pattern>   Filter by logger name
  --color          Enable colored output

Examples:
# Show last 50 lines and follow
clarity tail --lines 50 --follow

# Follow error logs with color
clarity tail --level error --follow --color

# Follow specific domain
clarity tail --name "api:auth" --follow
```

## Search Command

Search through logs with powerful filtering:

```bash
clarity search <pattern> [options]

Options:
  --level <level>      Filter by log level
  --name <pattern>     Filter by logger name
  --start <date>       Start date
  --end <date>         End date
  --case-sensitive    Enable case-sensitive search
  --context <n>       Show n lines of context

Examples:
# Search for errors
clarity search "connection failed" --level error

# Search with date range
clarity search "deploy" --start 2024-01-01 --end 2024-01-31

# Search with context
clarity search "exception" --context 5

# Complex search
clarity search "timeout" --name "api:*" --level error --case-sensitive
```

## Clear Command

Manage log history:

```bash
clarity clear [options]

Options:
  --level <level>    Clear specific log level
  --name <pattern>   Clear specific logger
  --before <date>    Clear logs before date
  --dry-run         Show what would be deleted
  --force           Skip confirmation

Examples:
# Clear old logs
clarity clear --before 2024-01-01

# Clear specific logger
clarity clear --name "temp:*"

# Clear with dry run
clarity clear --before 2024-01-01 --dry-run
```

## Config Command

Manage Clarity configuration:

```bash
clarity config <action> [options]

Actions:
  get     Get config value
  set     Set config value
  list    List all config
  reset   Reset to defaults

Options:
  --key <key>       Configuration key
  --value <value>   Configuration value
  --format <fmt>    Output format (json|yaml)

Examples:
# View all settings
clarity config list

# Get specific setting
clarity config get maxLogSize

# Update setting
clarity config set --key level --value debug

# Reset configuration
clarity config reset
```

## Global Options

These options work with all commands:

```bash
clarity [command] [options]

Global Options:
  --config <file>    Use specific config file
  --quiet           Suppress output
  --debug           Enable debug output
  --no-color        Disable colored output
  --help            Show help
  --version         Show version
```

## Environment Variables

The CLI respects these environment variables:

```bash
# General Settings
CLARITY_CONFIG=/path/to/config.json  # Custom config file
CLARITY_LOG_LEVEL=debug             # Default log level
CLARITY_NO_COLOR=1                  # Disable colors

# Filtering
CLARITY_FILTER_LEVEL=error         # Default level filter
CLARITY_FILTER_NAME="api:*"        # Default name filter

# Output
CLARITY_JSON=1                     # Default to JSON output
CLARITY_TIMESTAMP=1               # Include timestamps
```

## Tips & Tricks

1. **Command Composition**

   ```bash
   # Pipe search results to export
   clarity search "error" | clarity export --output errors.json

   # Watch filtered logs
   clarity watch --level error --name "api:*" | grep "timeout"
   ```

2. **Automated Monitoring**

   ```bash
   # Watch and notify on errors
   clarity watch --level error --json | jq -r '.message' | xargs -I {} notify-send "Error: {}"
   ```

3. **Log Rotation Management**

   ```bash
   # Clear old logs daily
   0 0 * * * clarity clear --before "$(date -d '7 days ago' -I)" --force
   ```

## Next Steps

- Check out the [Configuration Guide](./config) for setup options
- See the [Library Guide](./library) for programmatic usage
- Visit our [GitHub](https://github.com/stacksjs/clarity) for more examples
