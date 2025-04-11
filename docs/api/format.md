# Format

The format module provides string formatting functionality similar to printf-style formatting, with additional features for handling various data types.

## Overview

The format function allows you to create formatted strings with placeholders that are replaced with values. It supports positional arguments and can handle different data types, including strings, numbers, and objects.

## Usage

```ts
import { format } from 'clarity'

// Basic string formatting
format('Hello, %s!', 'world') // 'Hello, world!'

// Multiple arguments
format('The %s is %d years old.', 'cat', 5) // 'The cat is 5 years old.'

// JSON formatting
format('User data: %j', { name: 'Alice', age: 30 }) // 'User data: {"name":"Alice","age":30}'

// Object formatting (similar to JSON but preserves strings)
format('Config: %o', { debug: true, env: 'development' }) // 'Config: {"debug":true,"env":"development"}'

// Escaping percent signs
format('100%% complete') // '100% complete'

// Unused positionals are appended
format('Hello', 'world') // 'Hello world'
```

## Supported Format Specifiers

| Specifier | Description |
|-----------|-------------|
| `%s` | String |
| `%d`, `%i` | Number (integer) |
| `%j` | JSON (serializes objects using JSON.stringify) |
| `%o` | Object (similar to %j but preserves strings without quotes) |
| `%%` | Literal percent sign |

## API Reference

### format(message: string, ...positionals: any[]): string

Formats a string by replacing placeholders with values.

- **message**: The string containing format specifiers
- **positionals**: Values to replace the format specifiers

**Returns**: The formatted string

## Examples

### Basic Example

```ts
import { format } from 'clarity'

const name = 'Alice'
const age = 30

const message = format('Hello, my name is %s and I am %d years old.', name, age)
console.log(message) // 'Hello, my name is Alice and I am 30 years old.'
```

### Object Formatting

```ts
import { format } from 'clarity'

const user = { name: 'Bob', role: 'admin' }
const settings = { theme: 'dark', notifications: true }

format('User: %j, Settings: %o', user, settings)
// 'User: {"name":"Bob","role":"admin"}, Settings: {"theme":"dark","notifications":true}'
```

### Handling Unused Arguments

```ts
import { format } from 'clarity'

format('Status:', 'complete', 100, '%')
// 'Status: complete 100 %'
```
