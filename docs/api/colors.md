# Colors

The colors module provides ANSI color codes for terminal output. It allows for consistent styling and colorization of log messages in the terminal.

## Basic Colors

The module exports basic ANSI color codes for manipulating text style:

```ts
import { bold, dim, reset } from 'clarity'

console.log(`${bold}This is bold${reset} and this is not`)
console.log(`${dim}This is dimmed${reset} and this is not`)
```

## Foreground Colors

Foreground colors change the text color:

```ts
import { blue, cyan, gray, green, magenta, red, white, yellow } from 'clarity'

console.log(`${red}This is red text${reset}`)
console.log(`${green}This is green text${reset}`)
console.log(`${yellow}This is yellow text${reset}`)
console.log(`${blue}This is blue text${reset}`)
console.log(`${magenta}This is magenta text${reset}`)
console.log(`${cyan}This is cyan text${reset}`)
console.log(`${white}This is white text${reset}`)
console.log(`${gray}This is gray text${reset}`)
```

## Background Colors

Background colors change the color behind the text:

```ts
import { bgBlack, bgBlue, bgCyan, bgGreen, bgMagenta, bgRed, bgWhite, bgYellow } from 'clarity'

console.log(`${bgRed}This has a red background${reset}`)
console.log(`${bgGreen}This has a green background${reset}`)
console.log(`${bgYellow}This has a yellow background${reset}`)
console.log(`${bgBlue}This has a blue background${reset}`)
console.log(`${bgMagenta}This has a magenta background${reset}`)
console.log(`${bgCyan}This has a cyan background${reset}`)
console.log(`${bgWhite}This has a white background${reset}`)
```

## Log Level Colors

The module also provides a mapping of log levels to colors:

```ts
import { levels } from 'clarity'

// Example: levels.debug contains gray
// Example: levels.info contains blue
// Example: levels.success contains green
// Example: levels.warning contains yellow
// Example: levels.error contains red
```

## Utility Functions

### colorize

Wraps text with color codes:

```ts
import { colorize, red } from 'clarity'

// Both produce the same result:
const errorText1 = colorize('Error message', red)
const errorText2 = `${red}Error message${reset}`
```

### stripColors

Removes ANSI color codes from text:

```ts
import { colorize, red, stripColors } from 'clarity'

const coloredText = colorize('Error message', red)
const plainText = stripColors(coloredText) // "Error message"
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `reset` | `string` | Resets all styling |
| `bold` | `string` | Makes text bold |
| `dim` | `string` | Makes text dim |
| `black` | `string` | Black text color |
| `red` | `string` | Red text color |
| `green` | `string` | Green text color |
| `yellow` | `string` | Yellow text color |
| `blue` | `string` | Blue text color |
| `magenta` | `string` | Magenta text color |
| `cyan` | `string` | Cyan text color |
| `white` | `string` | White text color |
| `gray` | `string` | Gray text color |
| `bgBlack` | `string` | Black background color |
| `bgRed` | `string` | Red background color |
| `bgGreen` | `string` | Green background color |
| `bgYellow` | `string` | Yellow background color |
| `bgBlue` | `string` | Blue background color |
| `bgMagenta` | `string` | Magenta background color |
| `bgCyan` | `string` | Cyan background color |
| `bgWhite` | `string` | White background color |
| `levels` | `Record<LogLevel, string>` | Maps log levels to colors |
| `colorize` | `function` | Wraps text with color codes |
| `stripColors` | `function` | Removes ANSI color codes from text |
