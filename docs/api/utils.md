# Utils

The utils module provides utility functions for environment detection and data manipulation.

## Environment Detection

The module includes functions to detect whether the code is running in a browser or server environment.

### isBrowserProcess

Checks if the code is running in a browser environment.

```ts
import { isBrowserProcess } from 'clarity'

if (isBrowserProcess()) {
  // Code to run only in browser
}
else {
  // Code to run in Node.js or Bun
}
```

Returns `true` if running in a browser, `false` otherwise.

> Note: Always returns `false` in test environments (NODE_ENV=test or BUN_ENV=test).

### isServerProcess

Asynchronously checks if the code is running in a server environment.

```ts
import { isServerProcess } from 'clarity'

async function runServerCode() {
  if (await isServerProcess()) {
    // Code to run only on server
  }
  else {
    // Code to run in browser
  }
}
```

Returns a `Promise` that resolves to `true` if running in Node.js, Bun, or React Native, `false` otherwise.

> Note: Always returns `true` in test environments (NODE_ENV=test or BUN_ENV=test).

## Data Manipulation

### chunk

Splits an array into smaller chunks of a specified size.

```ts
import { chunk } from 'clarity'

const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const chunks = chunk(array, 3)
// Result: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
```

**Parameters:**

- `array`: The array to split into chunks
- `size`: The size of each chunk

**Returns:** An array of chunks, where each chunk is an array of elements from the original array.

## API Reference

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `isBrowserProcess` | None | `boolean` | Determines if code is running in a browser |
| `isServerProcess` | None | `Promise<boolean>` | Determines if code is running on a server |
| `chunk` | `array: T[], size: number` | `T[][]` | Splits an array into chunks of specified size |

## Examples

### Using chunk for Batch Processing

```ts
import { chunk } from 'clarity'

// Process items in batches
async function processItems(items: string[]) {
  const batches = chunk(items, 5)

  for (const batch of batches) {
    await Promise.all(batch.map(async (item) => {
      // Process each item
      await processItem(item)
    }))
    console.log('Batch processed')
  }
}
```

### Environment-Specific Code

```ts
import { isBrowserProcess, isServerProcess } from 'clarity'

async function initializeLogger() {
  if (isBrowserProcess()) {
    // Set up browser-specific logging
    return setupBrowserLogging()
  }

  if (await isServerProcess()) {
    // Set up server-specific logging with file system access
    return setupServerLogging()
  }

  // Fallback for other environments
  return setupBasicLogging()
}
```
