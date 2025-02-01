# CLI Guide

Clarity comes with a powerful CLI that helps you manage and analyze your logs. Here's a comprehensive guide to all available commands.

## Watch Command

Monitor logs in real-time with filtering options.

```bash
clarity watch [options]

Options:
  --level <level>     Filter by log level (debug, info, warning, error)
  --name <name>       Filter by logger name (supports patterns like "api:*")
  --json             Output in JSON format
  --timestamp        Include timestamps
  --verbose         Enable verbose output

Examples:
clarity watch --level error                # Watch error logs
clarity watch --name "api:*" --json       # Watch API logs in JSON format
```

## Log Command

Send one-off log messages through the CLI.

```bash
clarity log <message> [options]

Options:
  --level <level>    Log level (debug, info, success, warning, error)
  --name <name>      Logger name
  --verbose         Enable verbose output

Examples:
clarity log "Deployment started" --level info --name "deploy"
clarity log "Build failed" --level error
```

## Export Command

Export logs to a file in various formats.

```bash
clarity export [options]

Options:
  --format <format>   Output format (json or text)
  --output <file>     Output file path
  --level <level>     Filter by log level
  --name <name>       Filter by logger name
  --start <date>      Start date (ISO format)
  --end <date>        End date (ISO format)

Examples:
clarity export --format json --output logs.json
clarity export --level error --start 2024-01-01
```

## Tail Command

Show and follow the last N lines of logs.

```bash
clarity tail [options]

Options:
  --lines <n>        Number of lines to show (default: 10)
  --level <level>    Filter by log level
  --name <name>      Filter by logger name
  --follow          Follow log output in real time

Examples:
clarity tail --lines 50 --follow
clarity tail --level error --name "api"
```

## Search Command

Search through logs using patterns.

```bash
clarity search <pattern> [options]

Options:
  --level <level>      Filter by log level
  --name <name>        Filter by logger name
  --start <date>       Start date (ISO format)
  --end <date>         End date (ISO format)
  --case-sensitive    Enable case-sensitive search

Examples:
clarity search "error connecting" --level error
clarity search "deployment" --name "ci" --case-sensitive
```

## Clear Command

Clear log history with various filtering options.

```bash
clarity clear [options]

Options:
  --level <level>    Clear specific log level only
  --name <name>      Clear specific logger only
  --before <date>    Clear logs before date (ISO format)

Examples:
clarity clear --level debug
clarity clear --before 2024-01-01
```

## Config Command

Manage clarity configuration.

```bash
clarity config <action> [options]

Actions:
  get     Get a config value
  set     Set a config value
  list    List all config values

Options:
  --key <key>      Configuration key
  --value <value>  Configuration value (for set action)

Examples:
clarity config set --key level --value debug
clarity config get --key level
clarity config list
```

## Common Options

These options are available across multiple commands:

- `--level`: Filter by log level (debug, info, warning, error)
- `--name`: Filter by logger name (supports patterns like "api:*")
- `--verbose`: Enable verbose output

## Environment Variables

The CLI respects the following environment variables:

```bash
DEBUG=true                  # Enable logging
DEBUG=parser               # Enable specific logger
DEBUG=parser:*            # Enable logger and all subdomains
LOG_LEVEL=debug          # Show all logs
LOG_LEVEL=error         # Show only errors
```
