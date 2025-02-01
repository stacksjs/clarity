export type ColorFunction = (text: string) => void

export function yellow(text: string): string {
  return `\x1B[33m${text}\x1B[0m`
}

export function blue(text: string): string {
  return `\x1B[34m${text}\x1B[0m`
}

export function gray(text: string): string {
  return `\x1B[90m${text}\x1B[0m`
}

export function red(text: string): string {
  return `\x1B[31m${text}\x1B[0m`
}

export function green(text: string): string {
  return `\x1B[32m${text}\x1B[0m`
}
